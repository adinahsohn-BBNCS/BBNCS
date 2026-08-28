# BBNCS support tickets setup

The ticketing UI lives on **bbncs.com** inside this Astro site:

| URL | Purpose |
|---|---|
| `/it-support-services/` | Existing-clients blurb: open ticket modal, view ticket, admin link |
| `/it-support-services/?ticket` | Opens the ticket submission modal |
| `/support/` | Redirects to `/it-support-services/?ticket` |
| `/support/ticket/?t=TOKEN` | Client view + reply |
| `/admin/tickets/` | Admin queue (magic-link login) |
| `/admin/tickets/detail/?id=UUID` | Admin ticket detail |
| `/admin/tickets/settings/` | Google Calendar connect |

Backend: **Supabase** (Postgres + Auth + Storage + Edge Functions).

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full contents of `supabase/migrations/001_tickets.sql`.
3. In **Authentication → Providers → Email**, enable email magic links.
4. Under **Authentication → URL configuration**, add redirect URLs:
   - `http://localhost:4322/admin/tickets/`
   - `https://bbncs.com/admin/tickets/`
5. Seed your admin email:

```sql
insert into public.admin_users (email) values ('adi@bbncs.com')
on conflict (email) do nothing;
```

## 2. Site environment variables

Add to `.env` (local) and your deploy host env if applicable:

```
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Rebuild/redeploy the Astro site after setting these (`npm run build` / `npm run deploy`).

Until these are set, the ticket modal shows a fallback message pointing clients to phone/email.

## 3. Google Calendar (optional but planned)

1. In Google Cloud Console, create an OAuth client (Web application).
2. Authorized redirect URI:

   `https://YOUR_PROJECT.supabase.co/functions/v1/calendar-oauth?action=callback`

3. On the OAuth consent screen, add **Test users** (e.g. `adi@bbncs.com`) while the app is in Testing.
4. Install [Supabase CLI](https://supabase.com/docs/guides/cli), run `npx supabase login`, copy `.env.supabase.example` → `.env.supabase`, and paste your Google Client ID/Secret.
5. Deploy (PowerShell from repo root):

```powershell
.\scripts\deploy-calendar-functions.ps1
```

   Or manually:

```bash
npx supabase link --project-ref uuoeebuivoxnwapgpnaq
npx supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... SITE_URL=https://bbncs.com
npx supabase functions deploy calendar-oauth
npx supabase functions deploy calendar-sync
```

6. Sign in at `/admin/tickets/`, open **Settings**, click **Connect Google Calendar**.

Saving a visit schedule or due date on a ticket (with “Sync … to Google Calendar” checked) calls `calendar-sync`.

## 4. Smoke test

1. Open `/it-support-services/`, click **Open a support ticket**, submit a test ticket — check confirmation email.
2. Open the success link — confirm thread + reply works; try an attachment.
3. Open `/admin/tickets/`, magic-link sign in with allowlisted email.
4. Change status, add a reply and an internal note — client should get email on public reply.
5. Set a schedule and confirm a calendar event (after OAuth).

## 5. Ticket email notifications

1. Create a [Resend](https://resend.com) account and verify your sending domain (or use `onboarding@resend.dev` for testing).
2. Add to `.env.supabase`:

   ```
   RESEND_API_KEY=re_...
   NOTIFY_FROM_EMAIL=BBNCS Support <notifications@bbncs.com>
   ```

3. Deploy Edge Functions:

   ```powershell
   .\scripts\deploy-ticket-functions.ps1
   ```

   Or deploy `ticket-notify` and `ticket-attachment` manually in the Supabase dashboard.

4. Run `supabase/migrations/002_ticket_extras.sql` in the SQL Editor (extends `get_ticket_by_token` with attachments).

**Emails sent:**
- **Client** — confirmation when a ticket is submitted; update when admin replies
- **Admin** (`admin_users` emails) — new ticket; client reply

## 6. Attachments

Clients and admins can attach images, PDFs, or plain text (max 10 MB each) on submit and reply. Files are stored in the private `ticket-attachments` bucket via the `ticket-attachment` Edge Function.

## Notes

- Sales/consultation still uses FormSubmit on Contact / quote modal — tickets are for support work.
- Admin pages are `noindex`.
- Deploy ticket + calendar functions: `.\scripts\deploy-ticket-functions.ps1`
