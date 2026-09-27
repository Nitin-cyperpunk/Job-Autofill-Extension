# @jobfill/website

The SEO-focused marketing site for JobFill: Next.js (App Router) + TypeScript + Tailwind CSS v4.
Every page is statically generated at build time and uses server components only — the site adds
no client-side JavaScript of its own beyond the Next.js/React runtime.

It never receives candidate profile data — that stays in the extension.

## Setup

### Deploying on Vercel

- **Root Directory:** `apps/website`, with Framework Preset **Next.js**. Leave the build and install
  commands at their defaults.
- Keep **"Include files outside the root directory in the Build Step"** enabled (Vercel's default).
  The site imports the shared design tokens from `packages/theme/theme.css`.
- Add the environment variables below under Project → Settings → Environment Variables, at minimum
  `NEXT_PUBLIC_APP_URL` set to your production domain, then redeploy.

The site is a **standalone package** (its own `package-lock.json`, not in the root workspaces),
so installing it never touches the extension's dependencies:

```sh
cd apps/website
npm install
npm run dev          # http://localhost:3000
npm run verify       # production build + SEO checks
```

### Environment

| Variable                                                          | Purpose                                                                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                             | The site's own address (canonical URLs, sitemap, social cards). Default `https://www.jobfill.app`. |
| `NEXT_PUBLIC_BUYMEACOFFEE_URL`                                    | Buy Me a Coffee page. Default `https://buymeacoffee.com/nitinverse`.                               |
| `NEXT_PUBLIC_GITHUB_URL`                                          | GitHub repository. Default `https://github.com/Nitin-cyperpunk/Job-Autofill-Extension`.            |
| `NEXT_PUBLIC_CHROME_WEB_STORE_URL`                                | The Chrome Web Store listing. Until set, "Add to Chrome" links to `/install`.                      |
| `NEXT_PUBLIC_SUPPORT_EMAIL`                                       | Help/contact email. Hidden until set.                                                              |
| `NEXT_PUBLIC_X_URL`, `…_DOCS_URL`, `…_TERMS_URL`, `…_CREATOR_URL` | Optional links; hidden until set.                                                                  |

All values are public (no secrets). See [.env.example](.env.example); for local development copy it to
`.env.local`. The older names `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SUPPORT_URL` still work.

## Structure

```
app/                     Routes (one folder per URL)
  page.tsx               /  — landing page (WebApplication + FAQ schema)
  features/…             /features, /features/autofill, /features/ai-answers, /features/resume-parser
  privacy/ how-it-works/ install/ chrome-extension/ faq/
  blog/                  /blog and /blog/[slug] (statically generated)
  sitemap.ts robots.ts manifest.ts og-image.png/route.tsx (social card)
components/              ui.tsx (CTAs, FAQ, breadcrumbs, JSON-LD…), SiteChrome, ProductMockup, icons
content/                 faqs.ts, blog/index.ts (post metadata), blog/posts/*.tsx (post bodies)
lib/                     site.ts (facts & URLs), seo.ts (metadata helper), schema.ts (JSON-LD), routes.ts
scripts/check-seo.mjs    Build-output SEO checks
```

## SEO conventions

- Every page calls `pageMetadata()` → unique title and description, canonical URL, Open Graph and
  X/Twitter tags.
- Inner pages render `<Breadcrumbs>` (visible + `BreadcrumbList`); FAQ blocks render `FAQPage`;
  blog posts render `BlogPosting`; the layout renders `Organization` + `WebSite`.
- New page: add it to `lib/routes.ts` (sitemap). `npm run check:seo` fails on a missing sitemap
  entry, duplicate/missing title or description, bad canonical, missing OG/Twitter tags, ≠1 `<h1>`,
  invalid JSON-LD, missing CTAs, or broken internal links.
- New blog post: add metadata to `content/blog/index.ts`, the body to `content/blog/posts/`, and
  register it in `content/blog/registry.tsx`.

## Content rules

- Describe only what the extension actually does. No testimonials, user counts, ratings or
  invented statistics (`check-seo` flags rating markup and user-count phrasing).
- Privacy statements must match [PRIVACY.md](../../PRIVACY.md) and
  [docs/PRIVACY_ARCHITECTURE.md](../../docs/PRIVACY_ARCHITECTURE.md).
- The site itself loads no analytics or tracking. If that ever changes, update `/privacy`.
