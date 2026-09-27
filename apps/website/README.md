# @jobfill/website (placeholder)

Reserved for the Next.js marketing site (SEO, docs, blog, Chrome Web Store landing page).

It is intentionally **not** scaffolded yet and is **not** listed in the root `workspaces`.
When work starts:

1. `npx create-next-app@latest apps/website --ts --tailwind --eslint --app`
2. Set `"name": "@jobfill/website"` in its `package.json`.
3. Add `"apps/website"` to the root `package.json` `workspaces` array.

The website must never receive candidate profile data — that stays in the extension.
