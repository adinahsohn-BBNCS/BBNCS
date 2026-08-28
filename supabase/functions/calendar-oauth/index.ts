// Supabase Edge Function: Google Calendar OAuth start + callback
// Deploy: supabase functions deploy calendar-oauth
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SITE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function emailFromIdToken(idToken: string): string {
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (json.email || "").trim();
  } catch {
    return "";
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    },
  });
}

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user?.email) throw new Error("Unauthorized");

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: row } = await admin
    .from("admin_users")
    .select("email")
    .ilike("email", userData.user.email)
    .maybeSingle();
  if (!row) throw new Error("Not an admin");
  return { email: userData.user.email as string, admin };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "start";
  const siteUrl = (Deno.env.get("SITE_URL") || "https://bbncs.com").replace(/\/$/, "");
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")?.replace(/\s+/g, "");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim();
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/calendar-oauth?action=callback`;

  if (!clientId || !clientSecret) {
    return json({ error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set" }, 500);
  }

  try {
    if (action === "start") {
      await requireAdmin(req);
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: "bbncs",
      });
      return json({ url: `${GOOGLE_AUTH}?${params}` });
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return Response.redirect(`${siteUrl}/admin/tickets/settings/?gcal=error`, 302);
      }
      const body = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const tokenRes = await fetch(GOOGLE_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.refresh_token) {
        console.error(tokens);
        return Response.redirect(`${siteUrl}/admin/tickets/settings/?gcal=token_error`, 302);
      }

      let googleEmail = tokens.id_token ? emailFromIdToken(tokens.id_token) : "";
      if (!googleEmail && tokens.access_token) {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          googleEmail = (profile.email || "").trim();
        }
      }

      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      if (!googleEmail) {
        console.error("Google OAuth succeeded but no email in id_token or userinfo");
        return Response.redirect(`${siteUrl}/admin/tickets/settings/?gcal=email_error`, 302);
      }
      const calendarOwner = googleEmail;
      const expiry = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      // Replace any prior connection (switching Google accounts).
      await admin.from("calendar_credentials").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      await admin.from("calendar_credentials").insert(
        {
          admin_email: calendarOwner,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token || null,
          token_expiry: expiry,
          calendar_id: "primary",
          updated_at: new Date().toISOString(),
        },
      );

      return Response.redirect(`${siteUrl}/admin/tickets/settings/?gcal=connected`, 302);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Error" }, 401);
  }
});
