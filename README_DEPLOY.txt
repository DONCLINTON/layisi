LAYISI UGANDA — CLOUDFLARE PAGES DEPLOYMENT
================================================

Production domain: https://layisi.shop
GitHub production repository: DONCLINTON/layisi

PROJECT STRUCTURE
-----------------
- index.html: main Layisi marketplace.
- jobs/index.html: independent, standalone Jobs page. Keep this file in /jobs/.
- brokerage.html: standalone property and rentals page.
- _redirects: routes /jobs/ and /brokerage/ to their dedicated pages and sends other app routes to index.html.
- manifest.json and service-worker.js: PWA configuration.
- sitemap.xml and robots.txt: search-engine discovery.
- scripts/generate-sitemap.mjs: refreshes product, job and rental SEO URLs.
- .github/workflows/update-sitemap.yml: scheduled/manual sitemap refresh.
- Supabase integration and existing database SQL reference are retained.

CLOUDFLARE PAGES SETTINGS
-------------------------
Connect DONCLINTON/layisi to Cloudflare Pages.

- Production branch: main
- Framework preset: None
- Build command:
  npm install --no-audit --no-fund && npm run build:css && node scripts/generate-sitemap.mjs
- Build output directory: . (repository root)
- Environment variable: NODE_VERSION=22

Add layisi.shop as the custom domain in the Cloudflare Pages project and follow the DNS instructions shown by Cloudflare. Wait until the domain is active and HTTPS is working before submitting the sitemap.

IMPORTANT DATABASE STATUS
-------------------------
The SQL file is included as a reference. Do NOT rerun existing migrations merely because this ZIP is deployed. The existing Supabase project and public anon-key integration are preserved.

POST-DEPLOY TESTS
----------------
- Marketplace homepage, listing creation and listing details.
- Full-screen product photo viewer, zoom and swipe.
- Buyer-request form.
- Independent Jobs page at /jobs/: Uganda/International tabs, search, vacancy details and posting flow.
- Brokerage page at /brokerage/: rental listings and contact links.
- PWA manifest, installability and service worker.
- https://layisi.shop/sitemap.xml
- https://layisi.shop/robots.txt

GOOGLE INDEXING
---------------
Submit https://layisi.shop/sitemap.xml in Google Search Console after the custom domain is active. Google decides whether and when to crawl or index URLs; a sitemap supports discovery but does not guarantee indexing or ranking.

SECURITY
--------
The frontend uses the Supabase public anon key. Never place a Supabase service-role key or other secret in browser code or the GitHub repository. Public access must remain protected by the existing Supabase RLS and Storage policies.

PAYMENTS
--------
Layisi is a listing and contact platform, not a payment processor. Buyers and sellers must contact one another, verify the item/property and agree on payment and delivery directly.
