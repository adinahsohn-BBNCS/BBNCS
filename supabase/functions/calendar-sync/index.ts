// Supabase Edge Function: create/update/delete Google Calendar events for a ticket
// Deploy: supabase functions deploy calendar-sync
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_SERVICE_ROLE_KEY, SITE_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const CAL_API = "https://www.googleapis.com/calendar/v3";
const TZ = "America/Los_Angeles";

function googleClientId() {
  return Deno.env.get("GOOGLE_CLIENT_ID")?.replace(/\s+/g, "") || "";
}

function googleClientSecret() {
  return Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim() || "";
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
    return { accessToken: cred.access_token as string, calendarId: cred.calendar_id as string, credId: cred.id as string };
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
    .update({ access_token: tokens.access_token, token_expiry: expiry, updated_at: new Date().toISOString() })
    .eq("id", cred.id);

  return { accessToken: tokens.access_token as string, calendarId: cred.calendar_id as string, credId: cred.id as string };
}

async function deleteGoogleEvent(accessToken: string, calendarId: string, eventId: string) {
  const del = await fetch(
    `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  return del.ok || del.status === 404 || del.status === 410;
}

async function listTicketCalendarEvents(
  accessToken: string,
  calendarId: string,
  ticket: { id: string; ticket_number: number; google_event_id?: string | null; scheduled_start?: string | null; due_at?: string | null },
) {
  const found = new Map<string, { id: string; summary?: string }>();

  const byProp = await fetch(
    `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events?privateExtendedProperty=${encodeURIComponent("bbncs_ticket_id=" + ticket.id)}&singleEvents=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (byProp.ok) {
    const data = await byProp.json();
    for (const item of data.items || []) {
      if (item.id) found.set(item.id, item);
    }
  }

  const ticketTag = `T-${ticket.ticket_number}`;
  let timeMin: string | undefined;
  let timeMax: string | undefined;
  const anchor = ticket.scheduled_start || ticket.due_at;
  if (anchor) {
    const start = new Date(anchor);
    timeMin = new Date(start.getTime() - 7 * 86400000).toISOString();
    timeMax = new Date(start.getTime() + 7 * 86400000).toISOString();
  } else {
    timeMin = new Date(Date.now() - 180 * 86400000).toISOString();
    timeMax = new Date(Date.now() + 365 * 86400000).toISOString();
  }

  const search = new URLSearchParams({
    q: ticketTag,
    singleEvents: "true",
    timeMin,
    timeMax,
  });
  const byQuery = await fetch(
    `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events?${search}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (byQuery.ok) {
    const data = await byQuery.json();
    for (const item of data.items || []) {
      const hay = `${item.summary || ""} ${item.description || ""}`;
      if (item.id && hay.includes(ticketTag)) found.set(item.id, item);
    }
  }

  if (ticket.google_event_id) {
    found.set(ticket.google_event_id, { id: ticket.google_event_id });
  }

  return [...found.values()];
}

async function deleteTicketCalendarEvents(
  admin: ReturnType<typeof createClient>,
  ticket: { id: string; ticket_number: number; google_event_id?: string | null; scheduled_start?: string | null; due_at?: string | null },
) {
  const { accessToken, calendarId } = await getAccessToken(admin);
  const events = await listTicketCalendarEvents(accessToken, calendarId, ticket);
  if (!events.length) return { deleted: 0, event_ids: [] as string[] };

  const deleted: string[] = [];
  for (const ev of events) {
    if (await deleteGoogleEvent(accessToken, calendarId, ev.id)) deleted.push(ev.id);
  }
  return { deleted: deleted.length, event_ids: deleted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const ticket_id = body.ticket_id as string | undefined;
    const shouldDelete = body.delete === true;
    if (!ticket_id) return json({ error: "ticket_id required" }, 400);

    if (shouldDelete) {
      const { data: ticket, error } = await admin
        .from("tickets")
        .select("id, ticket_number, google_event_id, scheduled_start, due_at")
        .eq("id", ticket_id)
        .single();
      if (error || !ticket) return json({ error: "Ticket not found" }, 404);

      try {
        const result = await deleteTicketCalendarEvents(admin, ticket);
        return json({ ok: true, deleted: true, ...result });
      } catch (e) {
        return json({ error: (e as Error).message || "Could not delete calendar event" }, 502);
      }
    }

    const { data: ticket, error } = await admin
      .from("tickets")
      .select("*, clients(name, email, company, phone)")
      .eq("id", ticket_id)
      .single();
    if (error || !ticket) return json({ error: "Ticket not found" }, 404);

    const { accessToken, calendarId } = await getAccessToken(admin);
    const siteUrl = (Deno.env.get("SITE_URL") || "https://bbncs.com").replace(/\/$/, "");
    const client = ticket.clients || {};
    const clientName = (client.name || "Client").trim();
    const clientEmail = (client.email || "").trim();
    const clientPhone = (client.phone || "").trim();
    const clientCompany = (client.company || "").trim();
    const issue = (ticket.description || "").trim();

    const titleParts = [clientName, ticket.subject, `T-${ticket.ticket_number}`];
    if (clientPhone) titleParts.splice(1, 0, clientPhone);
    const title = titleParts.filter(Boolean).join(" · ");

    const contactLines = [
      "CONTACT",
      `Name: ${clientName}`,
      clientEmail ? `Email: ${clientEmail}` : null,
      clientPhone ? `Phone: ${clientPhone}` : null,
      clientCompany ? `Company: ${clientCompany}` : null,
    ].filter(Boolean) as string[];

    const description = [
      ...contactLines,
      "",
      "ISSUE",
      issue || ticket.subject || "(No description provided)",
      "",
      "---",
      `Ticket T-${ticket.ticket_number}`,
      `Subject: ${ticket.subject}`,
      `Urgency: ${ticket.urgency}`,
      `Status: ${ticket.status}`,
      "",
      `Admin: ${siteUrl}/admin/tickets/detail/?id=${ticket.id}`,
      `Client link: ${siteUrl}/support/ticket/?t=${ticket.access_token}`,
    ].join("\n");

    let start = ticket.scheduled_start;
    let end = ticket.scheduled_end;
    if (!start && ticket.due_at) {
      start = ticket.due_at;
      end = new Date(new Date(ticket.due_at).getTime() + 60 * 60 * 1000).toISOString();
    }

    // Clear calendar event if no schedule/due
    if (!start) {
      if (ticket.google_event_id) {
        await deleteGoogleEvent(accessToken, calendarId, ticket.google_event_id);
        await admin.from("tickets").update({ google_event_id: null }).eq("id", ticket.id);
      }
      return json({ ok: true, cleared: true });
    }

    if (!end) {
      end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    }

    const eventBody = {
      summary: title,
      description,
      start: { dateTime: start, timeZone: TZ },
      end: { dateTime: end, timeZone: TZ },
      extendedProperties: {
        private: {
          bbncs_ticket_id: ticket.id as string,
          bbncs_ticket_number: String(ticket.ticket_number),
        },
      },
    };

    let eventId = ticket.google_event_id as string | null;
    if (eventId) {
      const upd = await fetch(
        `${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        },
      );
      if (upd.status === 404) eventId = null;
      else if (!upd.ok) {
        const err = await upd.text();
        return json({ error: err }, 502);
      }
    }

    if (!eventId) {
      const create = await fetch(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });
      const created = await create.json();
      if (!create.ok) return json({ error: created.error?.message || "Create failed" }, 502);
      eventId = created.id;
      await admin.from("tickets").update({ google_event_id: eventId }).eq("id", ticket.id);
    }

    return json({ ok: true, google_event_id: eventId });
  } catch (e) {
    return json({ error: (e as Error).message || "Error" }, 400);
  }
});
