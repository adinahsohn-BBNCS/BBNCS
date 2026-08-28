// Supabase Edge Function: list Google Calendar events for admin scheduling UI
// Deploy: supabase functions deploy calendar-events

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const CAL_API = "https://www.googleapis.com/calendar/v3";

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

function googleClientId() {
  return Deno.env.get("GOOGLE_CLIENT_ID")?.replace(/\s+/g, "") || "";
}

function googleClientSecret() {
  return Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim() || "";
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
  return admin;
}

async function getAccessToken(admin: ReturnType<typeof createClient>) {
  const { data: cred, error } = await admin
    .from("calendar_credentials")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !cred) throw new Error("Google Calendar is not connected");

  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google OAuth secrets are not configured");

  const exp = cred.token_expiry ? new Date(cred.token_expiry).getTime() : 0;
  if (cred.access_token && exp > Date.now() + 60_000) {
    return {
      accessToken: cred.access_token as string,
      calendarId: cred.calendar_id as string,
      calendarEmail: cred.admin_email as string,
      credId: cred.id as string,
    };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: cred.refresh_token,
    grant_type: "refresh_token",
  });
  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokens.error_description || "Failed to refresh Google token");

  const expiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;
  await admin
    .from("calendar_credentials")
    .update({
      access_token: tokens.access_token,
      token_expiry: expiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cred.id);

  return {
    accessToken: tokens.access_token as string,
    calendarId: cred.calendar_id as string,
    calendarEmail: cred.admin_email as string,
    credId: cred.id as string,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });

  try {
    const admin = await requireAdmin(req);
    let timeMin = "";
    let timeMax = "";

    if (req.method === "POST") {
      const body = await req.json();
      timeMin = body.time_min || "";
      timeMax = body.time_max || "";
    } else {
      const url = new URL(req.url);
      timeMin = url.searchParams.get("time_min") || "";
      timeMax = url.searchParams.get("time_max") || "";
    }

    if (!timeMin || !timeMax) {
      return json({ error: "time_min and time_max required (ISO 8601)" }, 400);
    }

    const { accessToken, calendarId, calendarEmail } = await getAccessToken(admin);
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const listRes = await fetch(
      `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const listed = await listRes.json();
    if (!listRes.ok) {
      return json({ error: listed.error?.message || "Failed to list calendar events" }, 502);
    }

    const events = (listed.items || []).map((ev: Record<string, unknown>) => {
      const start = ev.start as Record<string, string> | undefined;
      const end = ev.end as Record<string, string> | undefined;
      return {
        id: ev.id,
        summary: ev.summary || "(No title)",
        start: start?.dateTime || start?.date || null,
        end: end?.dateTime || end?.date || null,
        allDay: Boolean(start?.date && !start?.dateTime),
      };
    });

    return json({ ok: true, calendar_email: calendarEmail, events });
  } catch (e) {
    return json({ error: (e as Error).message || "Error" }, 400);
  }
});
