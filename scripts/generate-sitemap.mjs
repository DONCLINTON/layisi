
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://layisi.shop';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const source = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
const urlMatch = source.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = source.match(/const\s+SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
  throw new Error('Supabase URL or anon key not found in index.html');
}

const SUPABASE_URL = urlMatch[1].replace(/\/$/, '');
const SUPABASE_KEY = keyMatch[1];

function slug(value) {
  return String(value || 'listing')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75) || 'listing';
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function images(value) {
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      value = [value];
    }
  }
  return Array.isArray(value)
    ? value.map(safeUrl).filter(Boolean)
    : [];
}

function listingImages(item) {
  return [...new Set([
    ...images(item.image_urls),
    ...images(item.images),
    ...images(item.image_url)
  ])];
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? `UGX ${number.toLocaleString('en-UG')}`
    : 'Contact seller for price';
}

function phoneNumber(value) {
  let number = String(value || '').replace(/\D/g, '');
  if (number.startsWith('0')) number = '256' + number.slice(1);
  return number;
}

function contactLink(value, phone) {
  const supplied = safeUrl(value);
  if (supplied) return supplied;

  const digits = phoneNumber(phone);
  return digits ? `https://wa.me/${digits}` : '';
}

async function fetchAll(table, select = '*', filters = {}) {
  const rows = [];

  for (let start = 0; ; start += 1000) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('order', 'created_at.desc');

    for (const [key, value] of Object.entries(filters)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${start}-${start + 999}`
      }
    });

    if (!response.ok) {
      throw new Error(`${table}: ${response.status} ${await response.text()}`);
    }

    const batch = await response.json();
    rows.push(...batch);

    if (batch.length < 1000) break;
  }

  return rows;
}

const sitemap = new Map();

function addUrl(url, priority = '0.7', image = '') {
  sitemap.set(`${SITE}${url}`, {
    priority,
    image,
    lastmod: new Date().toISOString().slice(0, 10)
  });
}

function layout(title, description, canonical, content, image = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description.slice(0, 300))}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Layisi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description.slice(0, 300))}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ''}
<style>
*{box-sizing:border-box}
body{margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,system-ui,sans-serif;line-height:1.6}
header{background:#0b0f19;padding:17px 20px}
.brand{font-size:25px;font-weight:900;text-decoration:none}
.brand span:first-child{color:#E8741E}
.brand span:last-child{color:#2EA0E0}
main{max-width:900px;margin:25px auto;padding:0 16px}
.panel{background:white;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden}
.content{padding:24px}
h1{font-size:clamp(24px,5vw,36px);line-height:1.2}
.photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:5px;background:#e2e8f0}
.photos img{width:100%;height:260px;object-fit:contain;background:#f1f5f9}
.price{font-size:24px;font-weight:900;color:#047857}
.muted{color:#64748b;font-size:14px}
.btn{display:inline-block;padding:12px 17px;border-radius:10px;text-decoration:none;font-weight:800;margin:8px 8px 0 0}
.contact{background:#16a34a;color:white}
.back{color:#047857;font-weight:800;text-decoration:none}
footer{padding:24px;text-align:center;color:#64748b;font-size:13px}
footer nav{margin-top:10px;line-height:2}
footer a{color:#475569;text-decoration:none;margin:0 5px}
footer a:hover{text-decoration:underline;color:#047857}
</style>
</head>
<body>
<header><a class="brand" href="/"><span>LAY</span><span>ISI</span></a></header>
<main>${content}</main>
<footer>
<p>Layisi Uganda · Marketplace, Jobs and Rentals</p>
<nav aria-label="Legal information">
<a href="/about.html">About</a> ·
<a href="/contact.html">Contact</a> ·
<a href="/privacy.html">Privacy Policy</a> ·
<a href="/terms.html">Terms & Conditions</a>
</nav>
<p><a href="/">Back to Layisi</a></p>
</footer>
</body>
</html>`;
}

async function writePage(folder, id, name, page) {
  const directory = path.join(ROOT, folder, String(id), slug(name));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'index.html'), page, 'utf8');
}

function photoMarkup(photos, title) {
  return photos.length
    ? `<div class="photos">${photos.map((photo, i) =>
        `<img src="${esc(photo)}" alt="${esc(title)} - image ${i + 1}" loading="${i ? 'lazy' : 'eager'}">`
      ).join('')}</div>`
    : '';
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

addUrl('/', '1.0');
addUrl('/jobs/', '0.9');
addUrl('/brokerage/', '0.9');
addUrl('/about.html', '0.5');
addUrl('/contact.html', '0.5');
addUrl('/privacy.html', '0.5');
addUrl('/terms.html', '0.5');

let listingCount = 0;
let jobCount = 0;
let rentalCount = 0;

// MARKETPLACE PRODUCTS, LAND AND PROPERTY LISTINGS
try {
  const listings = await fetchAll('listings');

  for (const item of listings) {
    if (item.id == null) continue;
    if (String(item.status || '').toLowerCase() === 'sold') continue;

    const title = item.title || 'Marketplace listing';
    const name = `${item.id}/${slug(title)}`;
    const url = `/product/${encodeURIComponent(item.id)}/${slug(title)}/`;
    const canonical = SITE + url;
    const photos = listingImages(item);
    const description = String(item.description || `${title} available on Layisi Uganda.`).slice(0, 300);
    const price = money(item.price_num ?? item.price);
    const phone = item.whatsapp || '';
    const wa = contactLink(item.whatsapp, item.whatsapp);
    const category = item.category || 'Marketplace';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      description,
      url: canonical,
      ...(photos[0] ? { image: photos } : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'UGX',
        ...(Number(item.price_num ?? item.price) > 0
          ? { price: Number(item.price_num ?? item.price) }
          : {}),
        availability: 'https://schema.org/InStock',
        url: canonical
      }
    };

    const content = `<article class="panel">
      ${photoMarkup(photos, title)}
      <div class="content">
        <p class="muted">${esc(category)} · Layisi Marketplace</p>
        <h1>${esc(title)}</h1>
        <p class="price">${esc(price)}</p>
        ${item.location ? `<p><b>Location:</b> ${esc(item.location)}</p>` : ''}
        ${item.condition ? `<p><b>Condition:</b> ${esc(item.condition)}</p>` : ''}
        ${item.business_name ? `<p><b>Seller:</b> ${esc(item.business_name)}</p>` : ''}
        <p>${esc(description)}</p>
        ${wa ? `<a class="btn contact" href="${esc(wa)}" target="_blank" rel="noopener">Contact seller on WhatsApp</a>` : ''}
        <p class="muted">Confirm availability, condition and payment arrangements directly with the seller.</p>
        <p><a class="back" href="/">← Back to Layisi Marketplace</a></p>
      </div>
    </article>`;

    const page = layout(`${title} | Layisi Uganda`, description, canonical, content, photos[0])
      .replace('</head>', `${jsonLd(schema)}\n</head>`);

    await writePage('product', item.id, title, page);
    addUrl(url, '0.8', photos[0] || '');
    listingCount++;
  }

  console.log(`Generated ${listingCount} marketplace pages.`);
} catch (error) {
  console.error('Marketplace generation failed:', error.message);
  throw error;
}

// JOB VACANCIES
try {
  const jobs = await fetchAll('jobs');

  for (const job of jobs) {
    if (job.id == null) continue;

    const title = job.title || 'Job opportunity';
    const url = `/jobs/${encodeURIComponent(job.id)}/${slug(title)}/`;
    const canonical = SITE + url;
    const description = String(job.description || `${title} vacancy on Layisi Uganda.`).slice(0, 300);
    const phone = job.whatsapp || '';
    const contact = contactLink(job.contact_link, phone);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title,
      description,
      datePosted: job.created_at || new Date().toISOString(),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company || 'Employer'
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location || job.market || 'Uganda',
          addressCountry: 'UG'
        }
      },
      url: canonical
    };

    const content = `<article class="panel">
      <div class="content">
        <p class="muted">JOB VACANCY · LAYISI CAREERS</p>
        <h1>${esc(title)}</h1>
        ${job.company ? `<p><b>Company:</b> ${esc(job.company)}</p>` : ''}
        ${job.location ? `<p><b>Location:</b> ${esc(job.location)}</p>` : ''}
        ${job.market ? `<p><b>Market:</b> ${esc(job.market)}</p>` : ''}
        ${job.job_type ? `<p><b>Employment type:</b> ${esc(job.job_type)}</p>` : ''}
        ${job.salary ? `<p><b>Salary:</b> ${esc(job.salary)}</p>` : ''}
        <h2>Job description</h2>
        <p>${esc(description).replace(/\n/g, '<br>')}</p>
        ${contact ? `<a class="btn contact" href="${esc(contact)}" target="_blank" rel="noopener">Contact / Apply</a>` : ''}
        <p class="muted">Contact the employer directly to confirm the vacancy and application requirements.</p>
        <p><a class="back" href="/jobs/">← Browse more jobs</a></p>
      </div>
    </article>`;

    const page = layout(`${title} | Layisi Jobs Uganda`, description, canonical, content)
      .replace('</head>', `${jsonLd(schema)}\n</head>`);

    await writePage('jobs', job.id, title, page);
    addUrl(url, '0.8');
    jobCount++;
  }

  console.log(`Generated ${jobCount} job pages.`);
} catch (error) {
  console.error('Job generation failed:', error.message);
  throw error;
}

// DEDICATED RENTAL PROPERTIES
try {
  const rentals = await fetchAll('house_rentals', '*', { status: 'eq.active' });

  for (const rental of rentals) {
    if (rental.id == null) continue;

    const title = `${rental.house_type || 'Rental property'} in ${rental.neighbourhood || 'Uganda'}`;
    const url = `/rentals/${encodeURIComponent(rental.id)}/${slug(title)}/`;
    const canonical = SITE + url;
    const photos = images(rental.image_urls);
    const description = String(rental.description || `${title} available for rent on Layisi.`).slice(0, 300);
    const phone = phoneNumber(rental.phone);
    const wa = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hello, I saw your ${title} on Layisi. Is it still available?`)}`
      : '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonical,
      ...(photos[0] ? { primaryImageOfPage: photos[0] } : {})
    };

    const content = `<article class="panel">
      ${photoMarkup(photos, title)}
      <div class="content">
        <p class="muted">PROPERTY & RENTALS · UGANDA</p>
        <h1>${esc(title)}</h1>
        <p class="price">${esc(money(rental.monthly_rent))} / month</p>
        ${rental.neighbourhood ? `<p><b>Neighbourhood:</b> ${esc(rental.neighbourhood)}</p>` : ''}
        ${rental.landmarks ? `<p><b>Nearby landmark:</b> ${esc(rental.landmarks)}</p>` : ''}
        <p>${esc(description)}</p>
        ${rental.contact_name ? `<p><b>Advertiser:</b> ${esc(rental.contact_name)}</p>` : ''}
        ${phone ? `<a class="btn contact" href="tel:+${phone}">Call advertiser</a>` : ''}
        ${wa ? `<a class="btn contact" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp advertiser</a>` : ''}
        <p class="muted">Confirm availability and inspect the property before making any payment.</p>
        <p><a class="back" href="/brokerage/">← Browse more rentals</a></p>
      </div>
    </article>`;

    const page = layout(`${title} | Layisi Rentals`, description, canonical, content, photos[0])
      .replace('</head>', `${jsonLd(schema)}\n</head>`);

    await writePage('rentals', rental.id, title, page);
    addUrl(url, '0.8', photos[0] || '');
    rentalCount++;
  }

  console.log(`Generated ${rentalCount} rental pages.`);
} catch (error) {
  console.error('Rental generation failed:', error.message);
  throw error;
}

// SITEMAP
const xml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
})[char]);

const entries = [...sitemap.entries()].map(([loc, data]) => `
<url>
<loc>${xml(loc)}</loc>
<lastmod>${data.lastmod}</lastmod>
<changefreq>daily</changefreq>
<priority>${data.priority}</priority>
${data.image ? `<image:image><image:loc>${xml(data.image)}</image:loc></image:image>` : ''}
</url>`).join('');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;

await fs.writeFile(path.join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');

console.log('--------------------------------');
console.log('LAYISI SEO GENERATION COMPLETE');
console.log(`Marketplace pages: ${listingCount}`);
console.log(`Job pages: ${jobCount}`);
console.log(`Rental pages: ${rentalCount}`);
console.log(`Sitemap URLs: ${sitemap.size}`);
console.log('--------------------------------');
