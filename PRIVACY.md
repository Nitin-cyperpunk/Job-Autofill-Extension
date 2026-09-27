# JobFill privacy

JobFill is local-first: your data stays on your device unless you use a feature that needs to
send it somewhere. This document explains exactly what data exists, where it lives, and when it can
leave. You can see the same information for your own setup on the **Privacy settings** page (the
_Privacy_ link in the popup, or _Privacy settings_ on your profile page). The technical version,
with data-flow diagrams and the audit results, is
[docs/PRIVACY_ARCHITECTURE.md](docs/PRIVACY_ARCHITECTURE.md).

## What JobFill stores, and where

Everything is stored in your browser's extension storage (`chrome.storage.local`) on this device:

- your profile (personal details, education, experience, skills, links);
- your resume file, only if you chose to keep it;
- settings (safe mode, debug mode);
- if you turn on AI answers: your provider choice, model and **your own API key**.

It is not synced to your Google account. JobFill does **not** keep AI prompts or answers (there is
no AI history), a history of sites or applications, or anything it reads from web pages.

JobFill has no servers, no accounts, no analytics, no telemetry and no crash reporting. Its logs
never contain your data: they are fixed messages, and errors are recorded by type only.
**Delete all local data** (on the profile page or Privacy settings) erases every item above.
**Export profile** and **Import profile** are on both pages too.

## What happens when you autofill

Autofill runs entirely inside your browser. JobFill reads the form on the page you're on and,
when you click _Autofill Application_, writes the matching values into it. JobFill itself sends
nothing anywhere. But once a value is in a form field, **the website can read it** — just as if you
had typed it — even before you submit (some sites save drafts as you go). Turn on _Preview fields
before filling_ to approve each field first. JobFill never submits forms, and never answers
demographic, identity or consent questions for you.

## Résumé import

Reading a résumé to fill your profile happens entirely in your browser: the file is parsed on
this device (PDF, DOCX or pasted text) and nothing is uploaded. You review every value before it's
saved, and values that differ from your profile are never overwritten without your choice. The
résumé file itself is only stored if you tick "Also save this file as your resume".

## AI-assisted answers (optional, off by default)

This is the only feature that sends data off your device, and only when you ask for it.

**When is data sent?** Only after you click **Generate with AI** for one question, review the
consent screen, and click **Generate Answer**. There is no background or automatic sending.

**What is sent?** The question, plus only the items you leave ticked on the consent screen. JobFill
proposes the minimum it needs for that one question:

| Item                     | Source       | Notes                                                    |
| ------------------------ | ------------ | -------------------------------------------------------- |
| Job title, company       | the page     |                                                          |
| Job description          | the page     | first 3,000 characters                                   |
| Current role, experience | your profile | title / company / years                                  |
| Relevant skills          | your profile | only skills the question or job mentions (max 12)        |
| Relevant experience      | your profile | up to 2 roles: title, company, dates, 300-char highlight |
| Education                | your profile | only when the question is about education                |
| Professional summary     | your profile | offered but **not** pre-ticked                           |

You can expand each item to see the exact text before sending, and untick anything.

**What is never sent**, whatever you tick: your name, email, phone, address, postal code,
LinkedIn/GitHub/website links, salary expectations, work-authorization or sponsorship answers,
demographic answers, and your resume file. This is enforced in code
([packages/ai/src/context.ts](packages/ai/src/context.ts)) and covered by tests.

**Where does it go?** Directly from your browser to the provider you chose — OpenAI
(`api.openai.com`), Google Gemini (`generativelanguage.googleapis.com`) or an OpenAI-compatible
endpoint you entered (it must use https; plain http is only allowed for a model server on your own
computer). The consent screen names the destination every time. The provider also sees your IP
address, as any website does. That provider's own
privacy policy and data-retention terms apply to what you send; check them before enabling AI.

**API keys.** JobFill does not ship with any API key. You bring your own; it is stored only in
this browser's extension storage, unencrypted like the rest of your JobFill data. Web pages can't
read it, and JobFill's in-page code never reads it: only JobFill's own settings pages and its
background worker (to make the request you approved) do. It is sent only to your chosen provider,
and removed by "Turn off AI and forget API key" (Privacy settings), "Turn off and forget AI
settings" (profile page) or "Delete all local data". Anyone with access to your computer account
could read it, so use a key with spending limits you're comfortable with.

**Answers are drafts.** AI can get facts wrong. You choose a version, can edit it, and it is only
inserted when you click **Insert Answer**. You review everything before submitting.

## Future: a JobFill backend

The AI layer is designed so a JobFill-operated service can replace bring-your-own-key: the
extension would send the same minimized request to that service, which would hold vendor
credentials server-side. The contract is documented in
[packages/ai/src/providers/backend.ts](packages/ai/src/providers/backend.ts). If that ships, it
will come with its own retention policy, and this document will be updated before it's enabled.

## Permissions

JobFill requests only the `storage` permission. Its content script runs on `http(s)` pages
(including iframes, where many application forms live), which Chrome describes as "Read and change
your data on all websites". It reads form fields and their labels (and a job posting's text when
you ask for an AI answer), and writes to the page only when you click Autofill or Insert Answer.
AI providers are reached with ordinary web requests the provider allows from browsers, without
cookies; no additional host permissions are requested.
