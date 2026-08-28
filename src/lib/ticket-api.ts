/** Client helpers for ticket Edge Functions (notify, attachments). */

export function ticketFunctionsBase(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
}

export async function notifyTicketEvent(
  functionsUrl: string,
  supabaseAnonKey: string,
  payload: {
    event: "ticket_created" | "admin_reply" | "client_reply";
    ticket_id: string;
    access_token?: string;
    message_body?: string;
  },
  authToken?: string,
) {
  if (!functionsUrl) return;
  try {
    const headers: Record<string, string> = {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    await fetch(`${functionsUrl}/ticket-notify`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Ticket notify failed:", e);
  }
}

export async function uploadTicketAttachment(
  functionsUrl: string,
  supabaseAnonKey: string,
  file: File,
  opts: { token?: string; ticket_id?: string; message_id?: string },
  authToken?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (opts.token) form.append("token", opts.token);
  if (opts.ticket_id) form.append("ticket_id", opts.ticket_id);
  if (opts.message_id) form.append("message_id", opts.message_id);

  const headers: Record<string, string> = { apikey: supabaseAnonKey };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${functionsUrl}/ticket-attachment`, {
    method: "POST",
    headers,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.attachment;
}

export async function getAttachmentDownloadUrl(
  functionsUrl: string,
  supabaseAnonKey: string,
  attachmentId: string,
  opts: { token?: string },
  authToken?: string,
) {
  const params = new URLSearchParams({ id: attachmentId });
  if (opts.token) params.set("token", opts.token);
  const headers: Record<string, string> = { apikey: supabaseAnonKey };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${functionsUrl}/ticket-attachment?${params}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not get file");
  return data as { url: string; file_name: string; content_type?: string };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
