-- BBNCS tickets: attachments metadata + extended get_ticket_by_token
-- Run in Supabase SQL Editor after 001_tickets.sql

-- Storage policies (private bucket; uploads via ticket-attachment Edge Function use service role)
drop policy if exists admin_read_attachments on storage.objects;
create policy admin_read_attachments on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and public.is_admin()
  );

drop policy if exists admin_delete_attachments on storage.objects;
create policy admin_delete_attachments on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'ticket-attachments'
    and public.is_admin()
  );

-- Return attachments with signed URLs loaded client-side via ticket-attachment function
create or replace function public.get_ticket_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
  v_client public.clients%rowtype;
  v_messages jsonb;
  v_attachments jsonb;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    raise exception 'Invalid token';
  end if;

  select * into v_ticket from public.tickets where access_token = trim(p_token);
  if not found then
    raise exception 'Ticket not found';
  end if;

  select * into v_client from public.clients where id = v_ticket.client_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'author_type', m.author_type,
      'author_name', m.author_name,
      'body', m.body,
      'created_at', m.created_at
    ) order by m.created_at
  ), '[]'::jsonb)
  into v_messages
  from public.ticket_messages m
  where m.ticket_id = v_ticket.id
    and m.is_internal = false;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'message_id', a.message_id,
      'file_name', a.file_name,
      'content_type', a.content_type,
      'size_bytes', a.size_bytes,
      'created_at', a.created_at
    ) order by a.created_at
  ), '[]'::jsonb)
  into v_attachments
  from public.ticket_attachments a
  where a.ticket_id = v_ticket.id;

  return jsonb_build_object(
    'id', v_ticket.id,
    'ticket_number', v_ticket.ticket_number,
    'access_token', v_ticket.access_token,
    'category', v_ticket.category,
    'urgency', v_ticket.urgency,
    'status', v_ticket.status,
    'subject', v_ticket.subject,
    'description', v_ticket.description,
    'due_at', v_ticket.due_at,
    'scheduled_start', v_ticket.scheduled_start,
    'scheduled_end', v_ticket.scheduled_end,
    'created_at', v_ticket.created_at,
    'updated_at', v_ticket.updated_at,
    'client', jsonb_build_object(
      'name', v_client.name,
      'email', v_client.email,
      'company', v_client.company,
      'phone', v_client.phone
    ),
    'messages', v_messages,
    'attachments', v_attachments
  );
end;
$$;
