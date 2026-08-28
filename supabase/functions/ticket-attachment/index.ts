// Supabase Edge Function: upload/download ticket attachments
// Deploy: supabase functions deploy ticket-attachment
// Secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "ticket-attachments";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

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

function safeName(name: string) {
  return (name || "file")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 120);
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

async function ticketByToken(admin: ReturnType<typeof createClient>, token: string) {
  const { data, error } = await admin
    .from("tickets")
    .select("id, access_token, status")
    .eq("access_token", token.trim())
    .single();
  if (error || !data) throw new Error("Ticket not found");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const attachmentId = url.searchParams.get("id");
      const token = url.searchParams.get("token") || "";
      if (!attachmentId) return json({ error: "id required" }, 400);

      const { data: att, error } = await admin
        .from("ticket_attachments")
        .select("*")
        .eq("id", attachmentId)
        .single();
      if (error || !att) return json({ error: "Attachment not found" }, 404);

      let allowed = false;
      if (token && token.length >= 16) {
        const ticket = await ticketByToken(admin, token);
        allowed = ticket.id === att.ticket_id;
      } else {
        try {
          await requireAdmin(req);
          allowed = true;
        } catch {
          allowed = false;
        }
      }
      if (!allowed) return json({ error: "Unauthorized" }, 403);

      const { data: signed, error: signErr } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(att.storage_path, 3600);
      if (signErr || !signed?.signedUrl) return json({ error: signErr?.message || "Could not sign URL" }, 502);

      return json({
        ok: true,
        file_name: att.file_name,
        content_type: att.content_type,
        url: signed.signedUrl,
      });
    }

    if (req.method !== "POST") return json({ error: "GET or POST required" }, 405);

    const form = await req.formData();
    const file = form.get("file");
    const token = String(form.get("token") || "");
    const ticketIdParam = String(form.get("ticket_id") || "");
    const messageId = form.get("message_id") ? String(form.get("message_id")) : null;

    if (!(file instanceof File)) return json({ error: "file required" }, 400);

    let ticketId = ticketIdParam;
    if (token && token.length >= 16) {
      const ticket = await ticketByToken(admin, token);
      if (ticket.status === "closed") return json({ error: "Ticket is closed" }, 400);
      ticketId = ticket.id;
    } else {
      await requireAdmin(req);
      if (!ticketId) return json({ error: "ticket_id or token required" }, 400);
    }

    if (file.size > MAX_BYTES) return json({ error: "File too large (max 10 MB)" }, 400);
    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(contentType)) {
      return json({ error: "File type not allowed. Use images, PDF, or plain text." }, 400);
    }

    const path = `${ticketId}/${crypto.randomUUID()}_${safeName(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: false,
    });
    if (upErr) return json({ error: upErr.message }, 502);

    const { data: row, error: insErr } = await admin
      .from("ticket_attachments")
      .insert({
        ticket_id: ticketId,
        message_id: messageId,
        file_name: file.name,
        storage_path: path,
        content_type: contentType,
        size_bytes: file.size,
      })
      .select("id, file_name, content_type, size_bytes, created_at")
      .single();
    if (insErr) {
      await admin.storage.from(BUCKET).remove([path]);
      return json({ error: insErr.message }, 502);
    }

    return json({ ok: true, attachment: row });
  } catch (e) {
    return json({ error: (e as Error).message || "Error" }, 400);
  }
});
