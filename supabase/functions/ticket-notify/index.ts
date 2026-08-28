// Supabase Edge Function: ticket email notifications (Resend)
// Deploy: supabase functions deploy ticket-notify
// Secrets: RESEND_API_KEY, NOTIFY_FROM_EMAIL, SITE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API = "https://api.resend.com/emails";

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

function siteUrl() {
  return (Deno.env.get("SITE_URL") || "https://bbncs.com").replace(/\/$/, "");
}

function ticketLink(token: string) {
  return `${siteUrl()}/support/ticket/?t=${encodeURIComponent(token)}`;
}

function adminLink(ticketId: string) {
  return `${siteUrl()}/admin/tickets/detail/?id=${encodeURIComponent(ticketId)}`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) {
    console.warn("RESEND_API_KEY not set — email skipped:", subject, "→", to);
    return { ok: false, skipped: true };
  }
  const from = Deno.env.get("NOTIFY_FROM_EMAIL")?.trim() || "BBNCS Support <notifications@bbncs.com>";
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Resend error:", data);
    return { ok: false, error: data.message || "Email send failed" };
  }
  return { ok: true, id: data.id };
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

async function loadTicket(admin: ReturnType<typeof createClient>, ticketId: string) {
  const { data, error } = await admin
    .from("tickets")
    .select("*, clients(name, email, company, phone)")
    .eq("id", ticketId)
    .single();
  if (error || !data) throw new Error("Ticket not found");
  return data;
}

async function adminEmails(admin: ReturnType<typeof createClient>) {
  const { data } = await admin.from("admin_users").select("email");
  return (data || []).map((r: { email: string }) => r.email).filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json();
    const event = body.event as string;
    const ticketId = body.ticket_id as string;
    const accessToken = body.access_token as string | undefined;
    const messageBody = body.message_body as string | undefined;

    if (!event || !ticketId) return json({ error: "event and ticket_id required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ticket = await loadTicket(admin, ticketId);
    const client = ticket.clients || {};
    const clientEmail = (client.email || "").trim();
    const clientName = (client.name || "Client").trim();
    const num = `T-${ticket.ticket_number}`;
    const link = ticketLink(ticket.access_token);
    const adminUrl = adminLink(ticket.id);

    if (event === "ticket_created") {
      if (!accessToken || accessToken !== ticket.access_token) {
        return json({ error: "Invalid access token" }, 403);
      }
      const createdAt = new Date(ticket.created_at).getTime();
      if (Date.now() - createdAt > 15 * 60 * 1000) {
        return json({ error: "Confirmation window expired" }, 403);
      }

      const clientHtml = `
        <p>Hi ${esc(clientName)},</p>
        <p>We received your support ticket <strong>${esc(num)}</strong>: ${esc(ticket.subject)}.</p>
        <p>Use this private link to check status and add updates anytime:</p>
        <p><a href="${link}">${link}</a></p>
        <p>For emergencies, call <a href="tel:+19515064755">951-506-4755</a>.</p>
        <p>— BBNCS Support</p>`;

      const adminHtml = `
        <p>New support ticket <strong>${esc(num)}</strong> from ${esc(clientName)} (${esc(clientEmail)}).</p>
        <p><strong>Subject:</strong> ${esc(ticket.subject)}</p>
        <p><strong>Urgency:</strong> ${esc(ticket.urgency)}</p>
        <p>${esc(ticket.description || "")}</p>
        <p><a href="${adminUrl}">Open in admin</a></p>`;

      const results = [];
      if (clientEmail) {
        results.push(await sendEmail(clientEmail, `${num}: We received your ticket`, clientHtml));
      }
      for (const email of await adminEmails(admin)) {
        results.push(await sendEmail(email, `${num}: New ticket — ${ticket.subject}`, adminHtml));
      }
      return json({ ok: true, results });
    }

    if (event === "admin_reply") {
      await requireAdmin(req);
      if (!clientEmail) return json({ ok: true, skipped: "no client email" });

      const html = `
        <p>Hi ${esc(clientName)},</p>
        <p>BBNCS replied on ticket <strong>${esc(num)}</strong> (${esc(ticket.subject)}):</p>
        <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0">${esc(messageBody || "")}</blockquote>
        <p><a href="${link}">View ticket and reply</a></p>
        <p>— BBNCS Support</p>`;

      const result = await sendEmail(clientEmail, `${num}: Update from BBNCS`, html);
      return json({ ok: true, result });
    }

    if (event === "client_reply") {
      if (!accessToken || accessToken !== ticket.access_token) {
        return json({ error: "Invalid access token" }, 403);
      }

      const html = `
        <p>${esc(clientName)} replied on ticket <strong>${esc(num)}</strong>:</p>
        <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0">${esc(messageBody || "")}</blockquote>
        <p><a href="${adminUrl}">Open in admin</a></p>`;

      const results = [];
      for (const email of await adminEmails(admin)) {
        results.push(await sendEmail(email, `${num}: Client reply — ${ticket.subject}`, html));
      }
      return json({ ok: true, results });
    }

    return json({ error: "Unknown event" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Error" }, 400);
  }
});
