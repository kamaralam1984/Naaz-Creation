# Karigar House — Build Status

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 1 | Brand identity & design foundation | ✅ | tokens, header/footer, mega menu, components, `/design-system` |
| 2 | Luxury homepage | ✅ | all sections, admin-orderable (`home_sections`), parallax hero |
| 3 | Catalog & shopping | ✅ | shop/category/collection/best-sellers/new/sale/featured/search, 8 filters, 6 sorts, pagination, quick view, hover swap, wishlist, search suggestions |
| 4 | Product page | ✅ | gallery + zoom + lightbox + video, variants, PIN checker, specs, artisan, reviews (moderated), related, recently viewed, JSON-LD |
| 5 | Cart, checkout, Razorpay | ✅ | server-priced cart, coupons, GST, shipping zones, gift wrap/cards, points; Razorpay + verify + webhook + idempotency; mock mode for tests |
| 6 | Customer accounts | ✅ | auth, reset, profile, addresses, orders + tracking, returns/refunds, wishlist, loyalty, referrals, abandoned-cart emails |
| 7 | Admin dashboard | ✅ | analytics, products, orders (invoice/label/refund), returns, customers, marketing, settings, staff RBAC |
| 8 | Advanced features | ✅ | corporate/bulk/custom enquiries, gift cards, referrals, loyalty, WhatsApp, newsletter + campaigns, multi-currency display |
| 9 | SEO, performance, security | ✅ | metadata, JSON-LD, sitemap, robots, canonicals, security headers, rate limits, validation, backups |
| 10 | QA & launch | ✅ (pending credentials) | see below |

## Verified
- `tsc` clean · `eslint` 0 errors · `next build` passes (≈90 routes)
- 41 HTTP-level checks (pages, pricing, coupon, stock, idempotent checkout, bad-signature rejection, payment retry, confirmation, token access)
- Signed Razorpay webhook: wrong amount ignored, valid payment confirms, duplicate event ignored, replay creates no second payment
- 24 order-lifecycle checks (idempotent payment, status machine, return → partial/full refund, cancel/expiry restore stock, oversell guard)
- Account and admin areas smoke-tested by their builders (RBAC: staff blocked from settings/coupons/staff)

## Needs the owner (cannot be done without credentials/content)
1. Razorpay keys + webhook secret (and a live ₹1 test + refund)
2. Resend API key + verified sender domain
3. Real photography/prices/stock — all catalog values are samples until confirmed in /admin
4. Shipping rates/zones, GST %, GSTIN on invoices; courier integration (Shiprocket) if wanted
5. Legal review of /legal/* pages
6. Domain + HTTPS + persistent disk (see README)
