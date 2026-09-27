# JobFill privacy

JobFill is local-first. This document explains exactly what data exists, where it lives, and the
one optional feature that can send data off your device.

## What JobFill stores, and where

Everything is stored in your browser's extension storage (`chrome.storage.local`) on this device:

- your profile (personal details, education, experience, skills, links);
- your resume file;
- settings (safe mode, debug mode);
- if you turn on AI answers: your provider choice, model and **your own API key**.

JobFill has no servers, no accounts and no analytics. **Delete all profile data** on the profile
page erases every item above.

## What happens when you autofill

Autofill runs entirely inside your browser. JobFill reads the form on the page you're on and
writes values into it. Nothing is sent anywhere by JobFill; the website you're applying to only
receives your application when **you** submit it. JobFill never submits forms, and never answers
demographic, identity or consent questions for you.

## AI-assisted answers (optional, off by default)

This is the only feature that sends data off your device, and only when you ask for it.

**When is data sent?** Only after you click **Generate with AI** for one question, review the
consent screen, and click **Generate Answer**. There is no background or automatic sending.

**What is sent?** The question, plus only the items you leave ticked on the consent screen. JobFill
proposes the minimum it needs for that one question:

| Item                     | Source      | Notes                                                         |
| ------------------------ | ----------- | ------------------------------------------------------------- |
| Job title, company       | the page    |                                                               |
| Job description          | the page    | first 3,000 characters                                        |
| Current role, experience | your profile| title / company / years                                       |
| Relevant skills          | your profile| only skills the question or job mentions (max 12)             |
| Relevant experience      | your profile| up to 2 roles: title, company, dates, 300-char highlight      |
| Education                | your profile| only when the question is about education                     |
| Professional summary     | your profile| offered but **not** pre-ticked                                |

You can expand each item to see the exact text before sending, and untick anything.

**What is never sent**, whatever you tick: your name, email, phone, address, postal code,
LinkedIn/GitHub/website links, salary expectations, work-authorization or sponsorship answers,
demographic answers, and your resume file. This is enforced in code
([packages/ai/src/context.ts](packages/ai/src/context.ts)) and covered by tests.

**Where does it go?** Directly from your browser to the provider you chose — OpenAI
(`api.openai.com`), Google Gemini (`generativelanguage.googleapis.com`) or an OpenAI-compatible
endpoint you entered. The consent screen names the destination every time. That provider's own
privacy policy and data-retention terms apply to what you send; check them before enabling AI.

**API keys.** JobFill does not ship with any API key. You bring your own; it is stored only in
this browser's extension storage. It is never given to web pages or to JobFill's content script:
only JobFill's own settings page (to show it's saved) and its background worker (to make the
request you approved) read it. It is sent only to your chosen provider, and removed by "Turn off
and forget AI settings" or "Delete all profile data". Anyone with access to your browser profile could read it,
so use a key with spending limits you're comfortable with.

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
(including iframes) so it can find form fields; it only reads the page until you click
Autofill or Insert Answer. AI providers are reached with ordinary web requests the provider allows
from browsers; no additional host permissions are requested.
