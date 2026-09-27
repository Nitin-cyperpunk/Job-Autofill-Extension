# JobFill

> Save your information once. Autofill job applications in seconds.

JobFill is a privacy-first Chrome extension. Your job-seeking profile is stored **only on your
device** in `chrome.storage.local`, and is used to fill application forms on the page you're on.
You always review and submit the application yourself — JobFill never submits.

## Privacy principles

- **Local-first.** The profile lives in `chrome.storage.local`. No backend, no account, no
  database of ours.
- **No network calls with profile data** — with one explicit, optional exception: AI-assisted
  answers, which are off by default and send a minimal, user-approved excerpt only when you click
  _Generate Answer_. See [PRIVACY.md](PRIVACY.md).
- **Minimal permissions.** Only `storage`. The content script runs on `http(s)` pages (and their
  iframes) to detect fields; it only writes when you click _Autofill_ or _Insert Answer_.
- **Never answers for you:** demographic, identity and consent questions are always left to you.
- **No analytics, auth or payments.**

All persistence goes through [`apps/extension/src/storage/`](apps/extension/src/storage/), so
there is one place to audit what is stored.

## Repository layout

```
apps/
  extension/            Chrome MV3 extension (Vite + React + Tailwind)
    test-pages/         Fixture forms (Google Forms, Greenhouse, Lever, Workday, React, …)
  website/              Placeholder for the future Next.js marketing site
packages/
  types/                @jobfill/types        — Profile, FieldDescriptor, FieldKey, export format
  shared/               @jobfill/shared       — validation, normalisation, migration, completeness,
                                                export/import, storage keys, message contract
  field-mapper/         @jobfill/field-mapper — deterministic mapping: normalizer, dictionary,
                                                matching, option matching, fill planning
  ai/                   @jobfill/ai           — optional AI answers: provider interface, data
                                                minimization, prompts, providers
```

Packages are **source-only TypeScript** (`main` points at `src/index.ts`); Vite compiles them into
the extension. Everything in `packages/` is DOM-free and unit-tested in isolation.

### Extension internals (`apps/extension/src`)

| Folder             | Responsibility                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| `field-detection/` | Finds and describes fields (`FieldDescriptor`); `FieldWatcher` follows DOM changes.    |
| `mapping/`         | Bridges live fields to the pure planner in `@jobfill/field-mapper`.                    |
| `autofill/`        | Executes a plan: framework-safe writes, custom dropdowns, files, follow-up passes.     |
| `adapters/`        | Site-adapter interface + registry (intentionally empty — generic first).               |
| `ai/`              | Job context from the page, inserting a chosen AI answer (content-script side).         |
| `content/`         | Content script (every frame): runs the watcher, answers popup messages.                |
| `background/`      | Service worker: first-run onboarding, AI requests (the only reader of the API key).    |
| `popup/`           | Autofill Application, preview (safe mode), summary, AI assistant, debug panel.         |
| `options/`         | Onboarding wizard + profile dashboard, AI settings, debug-mode toggle.                 |
| `storage/`         | Typed `chrome.storage.local` access: profile, resume, settings, AI settings.           |
| `profile/`         | `ProfileProvider` / `useProfile` React state layer.                                    |
| `components/`      | Reusable UI kit.                                                                       |
| `utils/`           | Messaging, multi-frame orchestration, file helpers, logger.                            |

### How an autofill works

```
Popup ─ANNOUNCE_FRAMES─▶ every frame ─FRAME_HAS_FIELDS─▶ popup      (which frames have fields)
Popup ─AUTOFILL_PLAN / AUTOFILL_EXECUTE─▶ content script (per frame)
          ├─ FieldWatcher.scanNow() → DetectedField[]          field-detection/
          ├─ planFill(descriptors, profile) → PlanItem[]       @jobfill/field-mapper (pure)
          └─ execute each item                                 autofill/
               text   → native setter + input/change/blur events
               choice → real click() on radio/checkbox (native or ARIA)
               select → native select, or generic custom-dropdown filler
               file   → resume via DataTransfer
          then: follow-up passes for fields our answers revealed
Popup ◀─ FillSummary (✓ filled · ⚠ needs review · open questions)
```

## Candidate profile

Sections: personal, professional, education[], experience[], projects[], skills, links (+ other
URLs) and a resume file. Types: [packages/types/src/profile.ts](packages/types/src/profile.ts).

### Storage layout (`chrome.storage.local`)

| Key                   | Contents                                                              |
| --------------------- | --------------------------------------------------------------------- |
| `jobfill.profile.v2`  | The `Profile` object (`schemaVersion: 2`), incl. resume metadata.     |
| `jobfill.resume.v1`   | The resume file: metadata + base64 bytes (PDF/DOC/DOCX, ≤ 5 MB).      |
| `jobfill.settings.v1` | `previewBeforeFill` (safe mode), `debugMode`.                         |
| `jobfill.ai.v1`       | Optional AI settings incl. the user's own API key (see PRIVACY.md).   |

Resume bytes live under their own key and are written in the same `storage.set` call as the
profile, so they never disagree. A phase-1 profile (`jobfill.profile.v1`) migrates on first load.

### Validation, onboarding, completeness, your data

- **Validation** (`@jobfill/shared`, zod): `normalizeProfile` is lenient for stored/imported data;
  `prepareSection` cleans then strictly validates what the editor saves.
- **Onboarding**: Welcome → Create profile (scratch or import) → Personal → Professional →
  Education → Experience → Projects → Skills → Links → Resume → Review → Complete. Driven by one
  registry ([options/sections/registry.tsx](apps/extension/src/options/sections/registry.tsx)).
- **Completeness**: weighted score with a hint for every missing point.
- **Export / Import / Reset / Delete all profile data** on the dashboard. Delete-all clears
  every JobFill key, including AI settings.

## Field detection

`detectFields()` returns a normalized, serializable
[`FieldDescriptor`](packages/types/src/field.ts) per field — label, where the label came from,
name / id / placeholder / aria-label / autocomplete / data-\* hints, nearby text, section heading,
options, required, visibility, and whether it already has a value.

- **Label cascade:** `aria-labelledby` → `<label>` → `aria-label` → `<legend>` → nearby DOM text
  (sibling cells, table cells, loose text — never borrowed across fields) → placeholder → title.
- **Covers** input, textarea, select, radio and checkbox groups, file inputs, contenteditable,
  ARIA widgets (Google Forms radios/checkboxes/listboxes), custom dropdowns (react-select
  comboboxes, `aria-haspopup="listbox"` buttons) and open Shadow DOM.
- **Skips** passwords, hidden inputs, disabled fields and invisible fields (hidden steps, bot
  honeypots). File inputs hidden behind a styled button are kept.
- **`FieldWatcher`** follows dynamic pages with one MutationObserver (plus one per open shadow
  root): relevant mutations only, net attribute change per batch (React re-sets attributes every
  render), debounce + max-wait + min-interval, paused while the tab is hidden, and listeners only
  hear about real changes. Detection is read-only, so it cannot trigger itself.

## Mapping and autofill (deterministic, no AI)

[`@jobfill/field-mapper`](packages/field-mapper/src/) maps each descriptor to a `FieldKey`
(`personal.email`, `education.institution`, `professional.requiresSponsorship`, …):

1. **Sensitive / consent guard** — gender, race, disability, veteran status, date of birth, SSN,
   "I agree…" and similar are never answered automatically.
2. **`autocomplete` tokens** — authoritative when present.
3. **Dictionary scoring** — every signal is normalized (`normalizeText`: compounds like
   "firstname", "e-mail", "Mobile No.", camelCase, filler words) and scored against the phrase
   dictionary ([dictionary.ts](packages/field-mapper/src/dictionary.ts)). Signal weights: label
   1.0 › aria-label › placeholder › name › data hints / id › nearby text. Excludes handle false
   friends ("Email address" ≠ address, "Reference phone" ≠ your phone); section context separates
   "Start date" in Education from Experience.
4. **Values and options** — derived values (full name, location, Nth education entry for repeated
   sections), and option matching for yes/no, numeric ranges ("3-5 years"), country aliases and
   degree levels ("M.Sc." → "Master's Degree").

`planFill()` turns that into a plan: **fill**, **fill-review** (low confidence, closest option, or
legal questions), **review** (needs you) or **skip** (already filled / optional without data).
The popup's **Preview fields before filling** (safe mode) shows this plan before anything is
written. Accuracy is pinned by a labelled corpus that must stay at 100%.

## Compatibility

Generic first: Google Forms, Greenhouse, Lever, Workday-style, custom React and plain HTML forms
all go through the same pipeline — see [test-pages/](apps/extension/test-pages/) and the
compatibility tests. What makes that work:

- **Custom dropdowns** via the ARIA contract (open with pointer events, type to filter, pick the
  option with the same matcher as native selects, verify). Never clicks a submit-type trigger,
  never presses Enter.
- **data-\* hints** (`data-automation-id`, `data-testid`, `formcontrolname`, …) as a mapping
  signal — this is what Workday-style markup needs, without a site hack.
- **Dynamic / multi-step forms**: the watcher, plus follow-up passes for fields revealed by our own
  answers. For a new step, run Autofill again.
- **iframes**: the content script runs in all frames; frames with fields announce themselves and
  the popup plans / fills across them (no extra permission).
- **Shadow DOM**: open shadow roots are detected and observed. Closed ones are unreachable by design.

**Site adapters** ([adapters/](apps/extension/src/adapters/)) exist for the rare case generic
handling can't work; the registry is empty and [types.ts](apps/extension/src/adapters/types.ts)
has the checklist to go through before adding one.

## AI-assisted answers (optional)

Off by default. For open questions the profile can't answer ("Why do you want to work here?"),
the popup offers **Generate with AI** → a consent screen listing exactly what will be sent (job
title, job description, relevant skills / experience — each untickable) and where → three
versions (generated / concise / professional) → **Insert Answer**. Never submits.

Providers implement one interface ([packages/ai](packages/ai/src/types.ts)): OpenAI, Google
Gemini and any OpenAI-compatible endpoint today; a `BackendProvider` defines the contract for a
future JobFill service so no vendor key needs to live in the browser. **Read
[PRIVACY.md](PRIVACY.md)** for what is and isn't sent.

## Debug mode

Dev builds always; release builds via **Advanced → Debug mode** on the profile page. The popup
then lists detected fields grouped into mapped (key, confidence %, reason — e.g.
`label "Email" matched "email"`) and unmapped, with a **Show overlay** button that outlines every
field on the page. In DevTools, the content-script console context exposes `jobfill.fields()`,
`jobfill.scan()`, `jobfill.stats()` and `jobfill.overlay()`.

## Getting started

Requirements: Node 20+ and npm.

```bash
npm install
npm run build        # → apps/extension/dist
```

**Load in Chrome:** `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
select `apps/extension/dist`. Onboarding opens on first install. Then open an application form,
click the JobFill icon and **Autofill Application**. Tabs open before installing need a reload.

### Testing against the fixture forms

```bash
npm run build:debug   # → apps/extension/dist-debug (debug tools always on)
npm run test-pages    # serves apps/extension/test-pages on http://localhost:5180
```

## Scripts (repo root)

| Script                 | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Vite dev server with extension hot reload                  |
| `npm run build`        | Typecheck + production build to `apps/extension/dist`      |
| `npm run build:debug`  | Debug build to `apps/extension/dist-debug`                 |
| `npm run test`         | Vitest unit tests (mapping corpus, detection, fill, AI, …) |
| `npm run test-pages`   | Serve the fixture forms                                    |
| `npm run typecheck`    | `tsc --noEmit` in every workspace                          |
| `npm run lint`         | ESLint across the monorepo                                 |
| `npm run format`       | Prettier write (`format:check` for CI)                     |

## Conventions

- Cross-package types go in `@jobfill/types`; extension-only types in `apps/extension/src/types`.
- Messages are declared once in `packages/shared/src/messages.ts`.
- Never log profile values.
- A real site mapped wrongly? Add the field to the accuracy corpus
  ([mapping-accuracy.test.ts](packages/field-mapper/src/mapping-accuracy.test.ts)) first, then
  fix the dictionary. The corpus must stay at 100%.
- Storage keys are versioned; breaking schema changes need a migration and a test.
- Icons in `apps/extension/public/icons` are generated placeholders — replace before publishing.

# Job-Autofill-Extension
