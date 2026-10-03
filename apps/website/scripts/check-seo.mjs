/**
 * SEO checks against the production build (run `next build` first):
 *   node scripts/check-seo.mjs
 *
 * For every prerendered page: unique <title> and meta description of sensible
 * length, canonical URL, Open Graph + X/Twitter tags, exactly one <h1>, valid
 * JSON-LD (with BreadcrumbList on inner pages), "Add to Chrome" and "Try JobFill"
 * CTAs, internal links that resolve, and a sitemap entry. Also checks that no page
 * makes claims we can't back (fake ratings, user counts).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const APP = join(import.meta.dirname, '..', '.next', 'server', 'app');
const SKIP = new Set(['_global-error', '_not-found']);

function pages() {
  const out = [];
  for (const entry of readdirSync(APP, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const file = join(entry.parentPath, entry.name);
    const rel = relative(APP, file)
      .split(sep)
      .join('/')
      .replace(/\.html$/, '');
    if (SKIP.has(rel)) continue;
    const path = rel === 'index' ? '/' : `/${rel}`;
    out.push({ path, html: readFileSync(file, 'utf8') });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const meta = (html, attr, name) => {
  const m =
    new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html) ??
    new RegExp(`<meta content="([^"]*)" ${attr}="${name}"`).exec(html);
  return m ? decode(m[1]) : null;
};

const PAGES = pages();
const routes = new Set(PAGES.map((p) => p.path));
const sitemap = readFileSync(join(APP, 'sitemap.xml.body'), 'utf8');
const siteUrl = /<loc>(https?:\/\/[^<]+?)<\/loc>/.exec(sitemap)[1].replace(/\/$/, '');
const errors = [];
const fail = (path, msg) => errors.push(`${path}: ${msg}`);
const titles = new Map();
const descriptions = new Map();
const PUBLIC_FILES = new Set([
  '/og-image.png',
  '/logo-48.png',
  '/logo-128.png',
  '/sitemap.xml',
  '/robots.txt',
]);

for (const { path, html } of PAGES) {
  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
  const description = meta(html, 'name', 'description');
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  const expected = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;

  if (!title) fail(path, 'missing <title>');
  else if (title.length > 70) fail(path, `title is ${title.length} chars: "${title}"`);
  if (!description) fail(path, 'missing meta description');
  else if (description.length < 70 || description.length > 165)
    fail(path, `description is ${description.length} chars`);
  if (titles.has(title)) fail(path, `duplicate title with ${titles.get(title)}`);
  if (descriptions.has(description))
    fail(path, `duplicate description with ${descriptions.get(description)}`);
  titles.set(title, path);
  descriptions.set(description, path);

  // "https://host" and "https://host/" are the same URL (an empty path is "/").
  const sameUrl = (x, y) => (x ?? '').replace(/\/$/, '') === (y ?? '').replace(/\/$/, '');
  if (!sameUrl(canonical, expected)) fail(path, `canonical ${canonical} ≠ ${expected}`);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name'])
    if (!meta(html, 'property', p)) fail(path, `missing ${p}`);
  if (!sameUrl(meta(html, 'property', 'og:url'), expected)) fail(path, 'og:url ≠ canonical');
  for (const n of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'])
    if (!meta(html, 'name', n)) fail(path, `missing ${n}`);

  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) fail(path, `${h1s} <h1> elements`);

  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const doc = JSON.parse(m[1]);
      for (const node of doc['@graph'] ?? [doc]) types.push(node['@type']);
    } catch (e) {
      fail(path, `invalid JSON-LD: ${e.message}`);
    }
  }
  if (!types.includes('Organization')) fail(path, 'no Organization schema');
  if (path !== '/' && !types.includes('BreadcrumbList')) fail(path, 'no BreadcrumbList schema');
  if (path.startsWith('/blog/') && !types.includes('BlogPosting'))
    fail(path, 'no BlogPosting schema');
  if (/data-faq/.test(html) && !types.includes('FAQPage'))
    fail(path, 'FAQ content without FAQPage schema');

  if (!/Add to Chrome/.test(html)) fail(path, 'no "Add to Chrome" CTA');
  if (!/Try JobFill/.test(html)) fail(path, 'no "Try JobFill" CTA');

  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].replace(/\/$/, '') || '/';
    if (target.startsWith('/_next/')) continue;
    if (
      !routes.has(target) &&
      !PUBLIC_FILES.has(target) &&
      !/\.(png|ico|webmanifest)$/.test(target)
    )
      fail(path, `broken internal link ${target}`);
  }
  if (!sitemap.includes(`<loc>${expected}</loc>`)) fail(path, 'not in sitemap.xml');

  const text = html.replace(/<[^>]+>/g, ' ');
  if (/aggregateRating|reviewCount|ratingValue/.test(html)) fail(path, 'rating markup');
  if (
    /\b\d[\d,.]*\+?\s*(k\s*)?(users|downloads|job seekers|applications filled|reviews)\b/i.test(
      text,
    )
  )
    fail(path, 'looks like a user/usage statistic');
}

const robots = readFileSync(join(APP, 'robots.txt.body'), 'utf8');
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push('robots.txt: no sitemap line');
const sitemapCount = sitemap.match(/<loc>/g).length;
if (sitemapCount !== PAGES.length)
  errors.push(`sitemap has ${sitemapCount} URLs, build has ${PAGES.length} pages`);

console.log(`Checked ${PAGES.length} pages against ${siteUrl}.`);
if (errors.length) {
  console.error(errors.map((e) => `  ✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('All SEO checks passed.');
