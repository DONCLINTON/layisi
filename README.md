# Layisi Uganda

Layisi is a static HTML/CSS/JavaScript marketplace connected to Supabase and deployed on **Cloudflare Pages** at https://layisi.shop.

## Main pages
- Marketplace: `/`
- Independent Jobs page: `/jobs/` (served from `jobs/index.html`)
- Brokerage and rentals: `/brokerage/` (served from `brokerage.html`)

The Jobs page is a separate standalone page. Keep `jobs/index.html` in its directory; do not merge it into `index.html`.

## Cloudflare Pages deployment

Connect the GitHub repository `DONCLINTON/layisi` to Cloudflare Pages.

Recommended project settings:
- Production branch: `main`
- Framework preset: `None`
- Build command: `npm install --no-audit --no-fund && npm run build:css && node scripts/generate-sitemap.mjs`
- Build output directory: `.` (repository root) (the repository root)
- Environment variable: `NODE_VERSION=22`

The build creates the compiled Tailwind stylesheet and refreshes product, job and rental SEO URLs using the existing public Supabase configuration. If the build environment cannot reach Supabase, the script is designed to retain the checked-in sitemap and rental pages.

Cloudflare Pages supports the `_redirects` file in this project. It preserves the standalone `/jobs/` and `/brokerage/` routes and sends other app routes to `index.html`.

## GitHub Actions sitemap refresh

The workflow in `.github/workflows/update-sitemap.yml` runs daily at 03:17 UTC and can also be started manually from GitHub Actions. It refreshes `sitemap.xml` and crawlable rental detail pages when public Supabase data is available.

## Database

The existing Supabase project and public anon-key integration are retained. The SQL file is supplied as a reference only. Do not rerun migrations just because this package is deployed; only run a separately reviewed migration when needed.

Never place a Supabase service-role key or other secret in browser code or the repository. Keep public access controlled by the existing Supabase RLS and Storage policies.

## Before launch
1. Add `layisi.shop` to the Cloudflare Pages project as a custom domain and complete the DNS setup Cloudflare provides.
2. Confirm HTTPS is active before submitting the sitemap.
3. Test `/`, `/jobs/`, `/brokerage/`, `/sitemap.xml` and `/robots.txt`.
4. Test listing creation, images, buyer requests, job posting, job viewing/application links and rental contact links.
5. Verify the PWA install prompt and service-worker offline behavior.
6. Submit `https://layisi.shop/sitemap.xml` in Google Search Console.

Layisi is a listing and contact platform, not a payment processor. Buyers and sellers contact one another directly and independently verify listings, properties and payment arrangements.
