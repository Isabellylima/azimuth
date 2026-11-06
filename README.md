# Azimuth Sailing Holidays — website

Static site (EN + PT-PT) + Cloudflare Worker booking API, deployed with **Cloudflare Workers Builds** from this repo.

## Edit content
Everything (programs, prices, 2027 dates, texts, WhatsApp number, e-mail) lives in **`src/content.mjs`**.
Push to `main` → Cloudflare rebuilds and publishes automatically (`node build.mjs`).

## Booking flow
1. Guest picks a date in the calendar on any experience page and sends the form.
2. The Worker (`src/worker.js`) validates availability, saves the request in KV (`BOOKINGS`) and e-mails `BOOKING_TO`.
3. The e-mail has **Confirm & block date** / **Decline** buttons. Confirm blocks that date/slot (or seats) on the website calendar.
4. All requests: `https://<site>/api/admin?key=<ADMIN_KEY>`.

The boat is shared: Lagos tours share morning/afternoon/evening slots, and every published Atlantic departure automatically blocks the Lagos calendar.

## Settings (Cloudflare dashboard → Worker `azimuth` → Settings → Variables and Secrets)
- `BOOKING_TO` (var): who receives requests
- `ADMIN_KEY` (secret): long random string
- E-mail sending: Cloudflare Email Service binding `EMAIL` (needs azimuthholidays.com onboarded) **or** `RESEND_API_KEY` secret.

## Reviews & Instagram
Elfsight widgets (Google reviews + Instagram feed), IDs in `SITE.elfsight`.

## SEO / AI
Per-page title/description, canonical + hreflang, JSON-LD (TravelAgency, TouristTrip, Event per departure, FAQPage, BreadcrumbList), `sitemap.xml`, `robots.txt` (AI crawlers allowed), `llms.txt`. Old Squarespace URLs are 301-redirected (`public/_redirects`).
