-- BBNCS support ticketing schema
-- Run in Supabase SQL Editor (or via supabase db push)

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.ticket_category as enum (
    'managed_it', 'backup', 'it_support', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_urgency as enum (
    'normal', 'urgent', 'emergency'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum (
    'open', 'in_progress', 'waiting_on_client', 'scheduled', 'resolved', 'closed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_author as enum (
    'client', 'admin', 'system'
  );
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_email_lower_idx
  on public.clients (lower(email));

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create sequence if not exists public.ticket_number_seq start 1001;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number integer not null default nextval('public.ticket_number_seq') unique,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  client_id uuid not null references public.clients (id) on delete restrict,
  category public.ticket_category not null default 'it_support',
  urgency public.ticket_urgency not null default 'normal',
  status public.ticket_status not null default 'open',
  subject text not null,
  description text not null default '',
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_created_at_idx on public.tickets (created_at desc);
create index if not exists tickets_client_id_idx on public.tickets (client_id);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_type public.message_author not null,
  author_name text,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_id_idx
  on public.ticket_messages (ticket_id, created_at);

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  message_id uuid references public.ticket_messages (id) on delete set null,
  file_name text not null,
  storage_path text not null,
  content_type text,
  size_bytes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_credentials (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null unique,
  refresh_token text not null,
  access_token text,
  token_expiry timestamptz,
  calendar_id text not null default 'primary',
  updated_at timestamptz not null default now()
);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- Admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       or a.user_id = auth.uid()
  );
$$;

-- RLS
alter table public.clients enable row level security;
alter table public.admin_users enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.calendar_credentials enable row level security;

do $$ declare r record; begin
  for r in
    select policyname, tablename from pg_policies where schemaname = 'public'
      and tablename in ('clients','admin_users','tickets','ticket_messages','ticket_attachments','calendar_credentials')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy admin_all_clients on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_tickets on public.tickets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_messages on public.ticket_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_all_attachments on public.ticket_attachments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy admin_read_admins on public.admin_users
  for select to authenticated using (public.is_admin());

create policy admin_calendar on public.calendar_credentials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RPCs (anon-safe via security definer)
create or replace function public.create_support_ticket(
  p_name text,
  p_email text,
  p_company text default null,
  p_phone text default null,
  p_category public.ticket_category default 'it_support',
  p_urgency public.ticket_urgency default 'normal',
  p_subject text default '',
  p_description text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client public.clients%rowtype;
  v_ticket public.tickets%rowtype;
  v_email text := lower(trim(p_email));
  v_name text := trim(p_name);
  v_subject text := nullif(trim(p_subject), '');
begin
  if v_name is null or length(v_name) < 2 then
    raise exception 'Name is required';
  end if;
  if v_email is null or v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'Valid email is required';
  end if;
  if v_subject is null then
    v_subject := left(trim(p_description), 80);
  end if;
  if v_subject is null or length(v_subject) < 3 then
    raise exception 'Subject or description is required';
  end if;

  select * into v_client from public.clients where lower(email) = v_email;
  if not found then
    insert into public.clients (name, email, company, phone)
    values (v_name, v_email, nullif(trim(p_company), ''), nullif(trim(p_phone), ''))
    returning * into v_client;
  else
    update public.clients
    set
      name = v_name,
      company = coalesce(nullif(trim(p_company), ''), company),
      phone = coalesce(nullif(trim(p_phone), ''), phone)
    where id = v_client.id
    returning * into v_client;
  end if;

  insert into public.tickets (
    client_id, category, urgency, subject, description
  ) values (
    v_client.id, p_category, p_urgency, v_subject, coalesce(p_description, '')
  )
  returning * into v_ticket;

  insert into public.ticket_messages (ticket_id, author_type, author_name, body, is_internal)
  values (
    v_ticket.id,
    'client',
    v_name,
    coalesce(nullif(trim(p_description), ''), v_subject),
    false
  );

  insert into public.ticket_messages (ticket_id, author_type, author_name, body, is_internal)
  values (
    v_ticket.id,
    'system',
    'BBNCS',
    'Ticket created. We received your request and will follow up soon.',
    false
  );

  return jsonb_build_object(
    'id', v_ticket.id,
    'ticket_number', v_ticket.ticket_number,
    'access_token', v_ticket.access_token,
    'status', v_ticket.status,
    'subject', v_ticket.subject
  );
end;
$$;

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
    'messages', v_messages
  );
end;
$$;

create or replace function public.reply_ticket_by_token(p_token text, p_body text, p_author_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
  v_client public.clients%rowtype;
  v_msg public.ticket_messages%rowtype;
  v_body text := trim(p_body);
begin
  if v_body is null or length(v_body) < 1 then
    raise exception 'Message is required';
  end if;

  select * into v_ticket from public.tickets where access_token = trim(p_token);
  if not found then
    raise exception 'Ticket not found';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'This ticket is closed';
  end if;

  select * into v_client from public.clients where id = v_ticket.client_id;

  insert into public.ticket_messages (ticket_id, author_type, author_name, body, is_internal)
  values (
    v_ticket.id,
    'client',
    coalesce(nullif(trim(p_author_name), ''), v_client.name),
    v_body,
    false
  )
  returning * into v_msg;

  if v_ticket.status in ('resolved', 'waiting_on_client') then
    update public.tickets set status = 'open' where id = v_ticket.id;
  end if;

  return jsonb_build_object(
    'id', v_msg.id,
    'author_type', v_msg.author_type,
    'author_name', v_msg.author_name,
    'body', v_msg.body,
    'created_at', v_msg.created_at
  );
end;
$$;

revoke all on function public.create_support_ticket from public;
revoke all on function public.get_ticket_by_token from public;
revoke all on function public.reply_ticket_by_token from public;

grant execute on function public.create_support_ticket to anon, authenticated;
grant execute on function public.get_ticket_by_token to anon, authenticated;
grant execute on function public.reply_ticket_by_token to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false)
on conflict (id) do nothing;
