# Layisi release notes

This release uses **Layisi** as the only product identity and `https://layisi.shop` as the canonical production domain.

## Updated
- Public branding, page copy, SEO metadata, generated rental pages and documentation use Layisi.
- PWA name, icons and service-worker cache namespace use Layisi.
- The browser stores favourites, saved searches and local view counts under Layisi-only keys. Existing device-only favourites and saved searches are not automatically copied into the new storage keys.
- Listing classification parsing is brand-neutral, so existing classified listings continue to work while newly created listings use the Layisi marker.
- The visitor counter now uses the Layisi counter namespace. Its aggregate count may start fresh under the new identifier.

## Backend compatibility
- Existing Supabase table names, columns, storage buckets and RLS policies are unchanged. Renaming backend resources is a separate database operation and is not required for this frontend rebrand.
- Existing listing records are not deleted or rewritten. The marketplace recognises their classification format without hard-coding a former brand name.

## Deployment
Deploy the contents of this project to the `DONCLINTON/layisi` GitHub repository connected to Cloudflare Pages. Keep the legacy Netlify deployment separate only while you still need its old URL to remain available to existing visitors.
