# Nazi Creation — handcrafted-goods store

Next.js 16 · React 19 · Tailwind 4 · SQLite (`node:sqlite`, Node ≥ 24) · Razorpay · Resend (email)

## Run locally
```bash
npm install
npm run dev            # http://localhost:3000  (auto-creates & seeds data/karigar.db on first request)
```
Default admin (dev only): `admin@nazicreation.com` / `Admin@12345` → **/admin**.
In dev, payments run in a clearly-labelled **test mode** (no keys needed): the order page shows "Simulate payment".

## What's inside
| Area | Where |
|---|---|
| Storefront: home, shop, filters, search, collections, product page, cart, checkout, order page | `src/app/*`, `src/components/*` |
| Accounts: register/login/reset, orders, tracking, returns, wishlist, addresses, loyalty/referrals | `src/app/(auth)`, `src/app/account` |
| Admin: dashboard, products, orders (invoice/label/refund), returns, customers, coupons, banners, collections, reviews, enquiries, newsletter, abandoned carts, settings, staff (RBAC) | `src/app/admin` |
| Backend core: DB schema, auth, pricing, orders, payments, email | `src/server/*` |
| Content/SEO/growth: gifting, corporate enquiries, gift cards, sitemap, robots, JSON-LD | `src/app/{gifting,gift-cards,…}`, `src/lib/seo.ts` |

## Going live — checklist
1. **Env**: copy `.env.example` → `.env.production`, fill values (see below).
2. **Razorpay**: put keys in env; add webhook `https://<domain>/api/payments/webhook` with events `payment.captured`, `payment.failed`, `order.paid` and the same secret as `RAZORPAY_WEBHOOK_SECRET`. Do a ₹1 live test, then refund it from the order page in /admin. Test-mode gateway is disabled automatically when keys exist.
3. **Email**: create a Resend account, verify your domain, set `RESEND_API_KEY` + `EMAIL_FROM`. (Until then emails appear only in the DB `email_outbox`.)
4. **Admin**: sign in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, change the password, create staff in *Staff & roles*. In *Settings* review shipping, tax (GST %), currency rates, social links, WhatsApp number.
5. **Content**: replace sample copy/prices/stock; add real photos in *Products* (uploads are saved in `UPLOAD_DIR`). Have the legal pages (`/legal/*`) reviewed by counsel; add GSTIN to invoices (`admin/orders/[id]/invoice`).
6. **Cron**: call `GET /api/cron/abandoned-carts` hourly with header `Authorization: Bearer $CRON_SECRET`.
7. **HTTPS + domain**: set `NEXT_PUBLIC_SITE_URL` to the final https URL (used by sitemap, canonical, emails, JSON-LD).

## Deploy
**Docker (recommended, needs a persistent volume):**
```bash
docker compose up -d --build        # data lives in the `karigar-data` volume at /data
```
SQLite requires a persistent disk, so use a VPS/VM/Docker host (not serverless). To move to Postgres later, only `src/server/db.ts` and the schema need porting.

## Database, migrations, backups
- Schema is created idempotently on boot (`CREATE TABLE IF NOT EXISTS` in `src/server/db.ts`). For a schema change add `ALTER TABLE …` guarded statements there; deploy; restart.
- **Backup** (safe while live): `npm run backup` (or `node scripts/backup.mjs /path`) → timestamped copy, keeps newest 14. Schedule daily via cron, copy off-server, and back up `UPLOAD_DIR` too.
  `0 3 * * * cd /app && DATABASE_PATH=/data/karigar.db node scripts/backup.mjs /data/backups`
- **Restore**: stop the app, replace `karigar.db` (delete `-wal`/`-shm`), start.

## Security notes
scrypt password hashing · revocable DB sessions (HttpOnly, SameSite=Lax) · zod validation everywhere · rate limiting (login, checkout, forms) · same-origin checks on JSON endpoints (server actions have Next's built-in CSRF protection) · payments verified server-side (HMAC + re-fetch from Razorpay + amount check) · webhook signature + dedupe · idempotent orders · role-based admin with server-side permission checks · security headers · upload magic-byte sniffing.
In-memory rate limits assume a single app instance; use Redis if you scale out.

## Scripts
`npm run dev | build | start | lint | typecheck | backup`
