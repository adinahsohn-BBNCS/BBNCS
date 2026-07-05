# Analytics and Search Console setup — BBNCS

## 1. Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: **URL prefix** → `https://bbncs.com`
3. Choose **HTML tag** verification
4. Copy the `content` value from the meta tag
5. Add to your local `.env` file (copy from `.env.example`):

   ```
   PUBLIC_GSC_VERIFICATION=paste_code_here
   ```

6. Deploy the site (`npm run deploy`)
7. Click **Verify** in Search Console
8. Submit sitemap: `https://bbncs.com/sitemap.xml`

(Google prefers `/sitemap.xml` over `/sitemap-index.xml` for small sites.)

### After verification

- Check **Pages** → confirm all service, location, blog, and case study URLs are indexed
- Review **Performance** monthly for query impressions and clicks

## 2. Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create account → property for **bbncs.com**
3. Create **Web** data stream → `https://bbncs.com`
4. Copy the **Measurement ID** (format `G-XXXXXXXXXX`)
5. Add to `.env`:

   ```
   PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

6. Deploy the site

### Events tracked automatically

The site fires GA4 events when configured:

| Event | Trigger |
|-------|---------|
| `phone_click` | User clicks a `tel:` link |
| `contact` | Same as phone click (GA4 recommended event) |
| `consultation_modal_open` | User opens the email/consultation modal |
| `consultation_cta_click` | User clicks a contact link with `?quote` |
| `form_submit` | User submits the consultation form |
| `generate_lead` | Same as form submit (GA4 recommended event) |

### Mark conversions in GA4

**Realtime vs. Admin:** Page hits show in Realtime immediately. Custom events appear in **Reports → Realtime → Event count by Event name** within ~30–60 seconds. The **Admin → Events** list (where you mark conversions) can take **24–48 hours** to populate after events first fire.

**Option A — wait for events to appear, then mark (recommended after first day):**

1. **Admin → Data display → Events**
2. When these appear, toggle **Mark as key event** (formerly “conversion”):
   - `form_submit` and/or `generate_lead`
   - `phone_click` and/or `contact`
   - `consultation_cta_click`

**Option B — don’t wait:** **Admin → Data display → Key events → New key event** and type the event name manually.

### Follow-up: check conversions — **Monday, July 6, 2026**

- [ ] Open **Admin → Data display → Events** — confirm `phone_click`, `contact`, `form_submit`, `generate_lead`, and `consultation_cta_click` are listed
- [ ] Mark key events for the three conversion goals above (phone, form/lead, consultation CTA)
- [ ] Optional: **Reports → Engagement → Events** to confirm counts look reasonable
- [ ] If events are still missing after 48 hours, test on https://bbncs.com/contact/ (click phone + Email us) and recheck **Realtime → Event count by Event name**

Measurement ID on live site: `G-K0PQ3RGV7E`

## 3. Bing Webmaster Tools (optional)

1. [bing.com/webmasters](https://www.bing.com/webmasters)
2. Import from Google Search Console or verify manually
3. Submit same sitemap URL

## Environment files

| File | Committed? | Purpose |
|------|------------|---------|
| `.env.example` | Yes | Template for GA4 and GSC vars |
| `.env` | No (gitignored) | Your real measurement IDs |

Never commit `.env` with real IDs if you prefer to keep them private — they are public in the HTML source once deployed anyway.
