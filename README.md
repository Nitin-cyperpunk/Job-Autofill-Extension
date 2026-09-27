# JobFill

> Save your information once. Autofill job applications in seconds.

JobFill is a privacy-first Chrome extension. Your job-seeking profile is stored **only on your
device** in `chrome.storage.local` and is used to fill application forms in the page you're on.

## Privacy principles (MVP)

- **Local-first.** The profile lives in `chrome.storage.local`. There is no backend, no account,
  no database of ours.
- **No network calls with profile data.** Nothing in the extension makes HTTP requests.
- **Minimal permissions.** Only `storage`. The content script runs on `http(s)` pages so it can
  find form fields when you click _Autofill_, and writes values in-page only.
- **No AI, analytics, auth, or payments** in this phase.

All persistence goes through [`apps/extension/src/storage/`](apps/extension/src/storage/) so there
is one place to audit what is stored.

## Repository layout

```
apps/
  extension/            Chrome MV3 extension (Vite + React + Tailwind)
  website/              Placeholder for the future Next.js marketing site
packages/
  types/                @jobfill/types        — Profile model, export format, ProfileFieldKey
  shared/               @jobfill/shared       — validation, normalisation, migration, completeness,
                                                export/import, storage keys, message contract
  field-mapper/         @jobfill/field-mapper — pure, DOM-free "field text → profile key" matcher
```

Packages are **source-only TypeScript** (their `main` points at `src/index.ts`). Vite compiles
them as part of the extension build, so there's no separate package build step.

### Extension internals (`apps/extension/src`)

| Folder             | Responsibility                                                                   |
| ------------------ | -------------------------------------------------------------------------------- |
| `background/`      | MV3 service worker. Opens the profile page on first install; routes messages.    |
| `content/`         | Content script. Listens for `AUTOFILL_REQUEST` / `DETECT_FIELDS` from the popup. |
| `popup/`           | Toolbar popup (React). "Autofill this page" + link to the profile.               |
| `options/`         | Onboarding wizard + profile dashboard (React), opened in a full tab.             |
| `profile/`         | `getProfileValue`, plus `ProfileProvider` / `useProfile` (React state layer).    |
| `storage/`         | Typed `chrome.storage.local` wrapper; profile + resume load/save/migrate/delete. |
| `components/`      | Reusable UI kit (fields, tag input, entry list, dialogs, completeness meter).    |
| `field-detection/` | Finds visible, editable inputs and collects their labels/names/hints.            |
| `field-mapping/`   | Bridges detected DOM fields to `@jobfill/field-mapper`.                          |
| `autofill/`        | Writes values so framework-controlled inputs (React/Vue/Angular) notice.         |
| `utils/`           | Typed messaging helpers, dev-only logger.                                        |
| `types/`           | Extension-local types (cross-package types live in `@jobfill/types`).            |

### Data flow

```
Options page ──saveProfile()──▶ chrome.storage.local
                                        │
Popup ──AUTOFILL_REQUEST──▶ Content script
                              ├─ loadProfile()        (reads chrome.storage.local directly)
                              ├─ detectFields()       (field-detection)
                              ├─ mapFields()          (field-mapping → @jobfill/field-mapper)
                              └─ fillElement()        (autofill; never overwrites non-empty fields)
```

The phase-1 matcher is a small keyword table — enough to prove the pipeline end to end. Later
phases extend `@jobfill/field-mapper` and field detection without touching the UI.

## Candidate profile

Sections: personal, professional, education[], experience[], projects[], skills, links (+ other
URLs) and a resume file. Types live in [packages/types/src/profile.ts](packages/types/src/profile.ts).

### Storage layout (`chrome.storage.local`)

| Key                  | Contents                                                          |
| -------------------- | ----------------------------------------------------------------- |
| `jobfill.profile.v2` | The `Profile` object (`schemaVersion: 2`), incl. resume metadata. |
| `jobfill.resume.v1`  | The resume file: metadata + base64 bytes (PDF/DOC/DOCX, ≤ 5 MB).  |

The resume bytes are kept under their own key so everyday profile reads and change events stay
small; both keys are written in a single `storage.set` call so they never disagree. 5 MB keeps
us well inside Chrome's 10 MB `storage.local` quota without requesting `unlimitedStorage`.
A phase-1 profile (`jobfill.profile.v1`) is migrated automatically on first load.

### Validation

Two layers in `@jobfill/shared`, both built on zod:

- **`normalizeProfile`** — lenient, for data we didn't just validate (storage, imports). Wrong
  types fall back to empty values, unknown keys are stripped, junk list entries are dropped. It
  always returns a well-formed `Profile`.
- **`prepareSection`** — strict, for the editor. Cleans (trim, lowercase email, normalise bare
  domains to `https://`, de-duplicate tags, drop blank entries) then validates required fields,
  formats (email, phone, URL — http(s) only), `YYYY-MM` dates and end ≥ start.

### Onboarding and editing

Welcome → Create profile (scratch or import) → Personal → Professional → Education → Experience →
Projects → Skills → Links → Resume → Review → Complete. Only name + email are required; every
other step can be skipped. After onboarding the options page becomes a dashboard where each
section is edited in place. Both are driven by one registry,
[options/sections/registry.tsx](apps/extension/src/options/sections/registry.tsx): each section
defines a `Form` and a read-only `Summary`, and `SectionEditor` handles draft → clean →
validate → save for all of them.

### Completeness

`computeCompleteness` weights each area (personal 25, professional 15, experience 15,
education 10, skills 10, links 10, resume 10, projects 5) and returns a hint for every missing
point, shown as a checklist in review, the dashboard and the popup.

### Your data

- **Export** downloads `jobfill-profile-YYYY-MM-DD.json` (optionally with the resume).
- **Import** validates the file, previews it, then replaces the current profile after
  confirmation.
- **Reset profile** clears the profile and resume and restarts onboarding.
- **Delete all profile data** runs `chrome.storage.local.clear()` after the user types DELETE.

## Getting started

Requirements: Node 20+ and npm.

```bash
npm install
npm run build        # → apps/extension/dist
```

### Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select `apps/extension/dist`.
4. The onboarding page opens automatically on first install. Complete the steps (only name and
   email are required).
5. Open any page with a form, click the JobFill toolbar icon, then **Autofill this page**.

Tabs that were already open before installing need a reload before the content script is present.

### Development

```bash
npm run dev
```

Runs Vite with the CRXJS plugin, which writes a dev build to `apps/extension/dist` with hot reload
for the popup/options pages. Load `apps/extension/dist` as above while the dev server is running.
Service-worker and content-script changes reload the extension automatically; reload the target
tab afterwards.

## Scripts (run from the repo root)

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Vite dev server with extension hot reload             |
| `npm run build`        | Typecheck + production build to `apps/extension/dist` |
| `npm run lint`         | ESLint across the monorepo                            |
| `npm run lint:fix`     | ESLint with autofix                                   |
| `npm run typecheck`    | `tsc --noEmit` in every workspace                     |
| `npm run test`         | Vitest unit tests (validation, migration, import, …)  |
| `npm run format`       | Prettier write                                        |
| `npm run format:check` | Prettier check (for CI)                               |

## Conventions

- Add cross-package types to `@jobfill/types`; extension-only types to `apps/extension/src/types`.
- Messages between popup / background / content are declared once in
  `packages/shared/src/messages.ts` (`ExtensionMessage` + `MessageResponseMap`).
- Never log profile values. `logger.info` is stripped to a no-op in production builds.
- Storage keys are versioned (`jobfill.profile.v2`); on breaking schema changes bump the suffix,
  add a migration in `storage/profile-storage.ts`, and cover it with a test.
- New profile field: add it to the type, `createEmptyProfile`, `normalize.ts`, `validation.ts`,
  then the section's `Form`/`Summary`. The type checker catches the first two;
  validation and the UI are yours to remember.
- Icons in `apps/extension/public/icons` are generated placeholders
  (`node apps/extension/scripts/generate-icons.mjs`). Replace before publishing.
# Job-Autofill-Extension
