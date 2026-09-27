# Production-readiness audit — JobFill 0.1.0

**Date:** 2026-09-28. **Build:** `npm run package` → `release/jobfill-0.1.0.zip` (28 files, about 202 KB).
**How it was checked:** the production build was extracted from the ZIP and loaded unpacked in
Chromium, then driven end to end. axe-core was run on every extension page. The bundle was
scanned for remote code and secrets. The full test suite was run (vitest, 19+ files).

Status key: ✅ passes · 🔧 fixed in this audit · ⚠️ open, needs action before submission · ℹ️ note

| #   | Area                        | Status | Summary                                                                                                 |
| --- | --------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| 1   | Manifest V3 compliance      | 🔧 ✅  | MV3 with a module service worker and no deprecated keys. Name and description changed for the listing.  |
| 2   | Permissions                 | ✅     | `storage` only. Pinned by a test.                                                                       |
| 3   | Host permissions            | ✅ ℹ️  | No `host_permissions`. The content script matches `http(s)://*/*` in all frames. Justification written. |
| 4   | Content Security Policy     | ✅     | Default MV3 CSP (`script-src 'self'`). Verified: inline script injection is blocked on extension pages. |
| 5   | Extension security          | 🔧 ✅  | Unreleased AI "JobFill service" provider could be selected by a stored setting. Now refused.            |
| 6   | No exposed secrets          | ✅     | No keys, tokens or `.env` in source or bundle. The packager blocks secret-like strings.                 |
| 7   | Production build            | ✅     | Minified, no source maps, no dev-server references. The ZIP loads and works in Chromium.                |
| 8   | Error handling              | ✅     | No runtime errors on any page. Unreachable tabs, quota and parse errors are shown to the user.          |
| 9   | Accessibility               | 🔧 ✅  | Final build: 0 serious/critical/moderate axe issues on all 9 pages (after fixes).                       |
| 10  | Performance                 | 🔧 ✅  | Code loaded on every page cut from about 117 KB to about 22 KB.                                         |
| 11  | Privacy disclosures         | 🔧 ⚠️  | Policy written and website privacy page updated. Only the support email and domain are missing.         |
| 12  | Data usage disclosures      | ✅     | Dashboard answers drafted in PRIVACY_PRACTICES.md.                                                      |
| 13  | User-facing permission text | 🔧     | Listing, FAQ and policy quote Chrome's exact warning and explain it.                                    |

---

## 1. Manifest V3 compliance

- `manifest_version: 3`, `background.service_worker` (type module), `action`, `options_ui`
  (open in tab), and content scripts declared statically. No `background.page`,
  `browser_action`, `webRequestBlocking` or `chrome.extension.*` APIs.
- 🔧 `name` is now **"JobFill — Job Application Autofill"** (34 of 75 chars) and `short_name`
  is "JobFill". `description` is now exactly the store short description (64 of 132 chars).
  The old description claimed "your profile stays on your device" without mentioning AI.
- ✅ Icons: 16/32/48/128 PNGs, sizes verified. 🔧 The 128 px icon now uses 96 px artwork with
  16 px padding, as the store asks.
- ℹ️ `version` is `0.1.0`. That's fine for a first listing. Each upload after it needs a higher
  version.
- Guarded by `apps/extension/src/store-listing.test.ts` (new) and `privacy-guards.test.ts`.

## 2–3. Permissions and host access

- `permissions: ["storage"]`. No `host_permissions`, `optional_*`, `tabs`, `scripting`,
  `webRequest`, `cookies`, `history` or `downloads`.
- The content script runs on `https://*/*` and `http://*/*` with `all_frames` and
  `match_about_blank`. This causes Chrome's "Read and change all your data on all websites"
  warning and **in-depth review**, which can take longer. The justification (and why not
  `activeTab`) is in [PRIVACY_PRACTICES.md](PRIVACY_PRACTICES.md).
- ℹ️ `web_accessible_resources` exposes 12 hashed JS chunks to all sites. CRXJS generates these so
  the content script can lazy-load autofill code. Side effect: a page could detect that JobFill
  is installed by requesting a chunk URL. There's no data exposure. The chunks are the same public
  code as the ZIP. Acceptable for launch. A possible hardening step is `use_dynamic_url: true`
  once CRXJS supports it reliably.
- AI provider calls are ordinary CORS `fetch`es from the service worker, without cookies, so no
  host permission is needed. ⚠️ Test each provider from the packed build (see the checklist).
  A provider that doesn't send CORS headers for extension origins would fail.

## 4. Content Security Policy

No custom `content_security_policy`, so the MV3 default applies: `script-src 'self';
object-src 'self'`. This is the strictest policy the store accepts, and it can't be loosened
for remote code. Checked live: injecting an inline `<script>` into the options page is blocked
by the CSP. No inline scripts in the built HTML.

## 5. Extension security

- No `eval`, `new Function`, remote `<script>`, `innerHTML` with page data in extension pages,
  or `externally_connectable`.
- Messages: the content script only acts on messages from the extension (`chrome.runtime`).
  The popup sends field ids, never values. Values are resolved from local storage inside the
  content script.
- Autofill never clicks submit, image or reset buttons, never presses Enter, and never fills
  hidden or honeypot fields, demographic questions or consent boxes. All of these are covered by tests.
- Custom AI endpoints must be https (http only for localhost). API keys are never readable by
  content scripts.
- 🔧 **Fixed:** `createProvider()` didn't check `available`, so the unreleased "JobFill service"
  provider could be used if a stored setting named it. That would contradict the privacy
  policy. It's now refused (`packages/ai/src/registry.ts`), with a test.

## 6. Secrets

A scan of source and `dist/` found no API keys (`sk-`, `AIza`, `ghp_`), private keys or `.env`
files. The only hosts in the bundle are the AI providers the user can choose (`api.openai.com`,
`generativelanguage.googleapis.com`), plus the w3.org namespaces, react.dev and example.com in
placeholders. `scripts/package-extension.mjs` refuses to package if secret-like strings reappear.

## 7. Production build

- `npm run build`: typecheck, then a minified Vite build with no source maps.
- 🔧 **New:** `npm run package` builds, runs pre-flight checks (MV3, name and description
  lengths, icons, permissions, no maps, dev URLs, remote scripts, eval or secrets), and writes a
  reproducible ZIP to `release/` (git-ignored).
- **Tested from the ZIP:** extracted with an independent unzipper (Python `zipfile`, integrity
  OK, `manifest.json` at the root), loaded unpacked in Chromium, autofill run on a local
  application form:
  - ✓ Full Name, Email, Location, LinkedIn Profile URL (the field was pre-filled with
    `https://`), GitHub, Personal Website, X, Resume Drive Link and the resume file were all
    verified in the DOM and seen by the page's own `change` listeners.
  - ⚠ the open question was left for the user.
  - The form was not submitted.

## 8. Error handling

- No page errors or console errors on the popup and 8 options routes, fresh install and populated
  profile included.
- The popup shows a message when the tab can't be reached (for example on `chrome://` pages and
  the Web Store).
- Storage quota errors become "Try a smaller resume file". Resume parse errors are shown in the
  import flow, which then offers paste text.
- Fill results are verified. Values that the page rejects or clears are reported as **Failed**,
  never as filled.

## 9. Accessibility (axe-core 4, WCAG 2.1 A/AA + best practice)

First pass: 2 serious issue types (`aria-label` on role-less `<span>`s, "Not added" text at
2.56:1 contrast) and 3 moderate ones (no `<h1>` in the popup and some onboarding steps, no
`<main>` on the import-resume route).

🔧 All fixed. The UI owner applied sr-only text, raised the faint token to ≥ 4.5:1 in both
themes, and added `<h1>` and `<main>`. This audit fixed a heading jump (h1 → h3) in "Resume &
Professional Links".

**Final run on the extracted ZIP:** popup, welcome, start, resume & links, personal, review,
import resume, profile dashboard and privacy all have ✅ 0 serious / critical / moderate issues,
and no runtime errors.

## 10. Performance

- The content script runs on every page, so what it loads matters.
- 🔧 **Fixed:** it imported `STORAGE_KEYS` from the `@jobfill/shared` barrel. That pulled Zod and
  every profile schema (a 96 KB chunk) into every page. It now imports
  `@jobfill/shared/constants`. **Eager code per page: about 117 KB → about 22 KB.** Autofill,
  mapping and debug code still load only when the user asks.
- Sub-frames without form controls stay idle (no MutationObserver). The detection watcher
  debounces mutations.
- Popup and options bundles: about 22 KB and 105 KB, plus a shared 234 KB UI chunk. They load
  only when opened.

## 11–13. Privacy, data disclosures and permission explanations

- 🔧 Written: [PRIVACY_POLICY.md](PRIVACY_POLICY.md) (Limited Use, no-sale, retention, deletion,
  AI flow, resume attachment, children, changes, contact), [PRIVACY_PRACTICES.md](PRIVACY_PRACTICES.md)
  (single purpose, justifications, remote code, data categories, certifications),
  [LISTING.md](LISTING.md), [FAQ.md](FAQ.md) and [SUPPORT.md](SUPPORT.md).
- The extension's own Privacy settings page already lists what's stored, what can leave the
  device and the delete and export controls.
- 🔧 **Website** (`apps/website`): these were applied by the UI owner:
  - the universal-compatibility wording fixes and "tested on sample pages" notes;
  - on the privacy page: last-updated date, retention, no selling or sharing, a changes note, the
    Limited Use statement, and a contact line (shown once `NEXT_PUBLIC_SUPPORT_EMAIL` is set);
  - "Need help instead?" on /support and "Still stuck?" on /faq, plus a Troubleshooting FAQ group;
  - Chrome's exact permission warning on /install.
- ⚠️ **Your decision: resume wording.** The import screen and the website say "Your resume stays
  on this device unless you choose an AI/cloud feature." It was kept because your spec asked for
  it word for word. Accuracy check:
  - there is no cloud feature, and AI never receives the resume file;
  - the file _does_ leave the device when JobFill attaches it to a job site's upload field.

  A more accurate line: "Your resume is read on this device. It's only sent to a job site when
  JobFill attaches it to an application you're filling." The store docs here already describe it
  that way.

- ⚠️ **Your decision: placeholders.** The website's GitHub card still shows "coming soon", because
  your spec asked for marked placeholders. Store reviewers sometimes treat placeholders as an
  unfinished site. Set the URL or hide the card before submitting.
- ⚠️ **No support email or domain exists yet.** Every ⟨…⟩ placeholder in these documents
  depends on them.
