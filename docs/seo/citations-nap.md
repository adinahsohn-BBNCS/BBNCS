# Citations and NAP consistency — BBNCS

**NAP** = Name, Address, Phone. Every directory listing must use identical information.

## Canonical NAP (use everywhere)

```
Bits, Bytes & Nibbles
27780 Jefferson Ave, Suite G
Temecula, CA 92590
951-506-4755
https://bbncs.com
sales@bbncs.com
```

Short name **BBNCS** is fine in marketing copy, but directory listings should use the full business name above.

## Priority directories

| Platform | Action |
|----------|--------|
| [Google Business Profile](https://business.google.com) | Claim, verify, optimize — see `gbp-checklist.md` |
| [Bing Places](https://www.bingplaces.com) | Claim listing, match NAP |
| [Apple Business Connect](https://businessconnect.apple.com) | Claim listing |
| [Yelp](https://biz.yelp.com) | Claim or create |
| [BBB](https://www.bbb.org) | Verify accreditation if applicable |
| [Temecula Valley Chamber](https://www.temeculachamber.org) | Membership / directory listing |
| [LinkedIn Company Page](https://www.linkedin.com/company/setup/new/) | Create with NAP + link to bbncs.com |

## Social profiles

| Platform | URL |
|----------|-----|
| Facebook | https://www.facebook.com/bits-bytes-and-nibbles-368782795024 |
| Google Reviews | See `googleReviewsUrl` in `src/data/site.ts` |

Add LinkedIn, Instagram, or YouTube URLs to `src/data/site.ts` → `business.social` when accounts are created. Empty profiles are hidden from the site header automatically.

## Audit process (quarterly)

1. Google your business name + Temecula
2. Open every result with address or phone info
3. Fix mismatches (old phone numbers, wrong suite, "Bits Bytes and Nibbles Inc" variants)
4. Remove duplicate listings where possible
5. Note any listing using **951-291-8762** — that is an outdated number on some aggregators; request correction to **951-506-4755**

## Legacy WordPress / aggregator cleanup

Old listings may still reference:

- Previous WordPress site structure
- "Bits Bytes and Nibbles Computer Services" as site name
- Accountant-home or friends pages (now redirected on bbncs.com)

Update website URL to `https://bbncs.com` on every profile you control.
