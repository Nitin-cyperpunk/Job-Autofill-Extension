# Chrome Web Store: Privacy practices tab

Answers for the **Privacy practices** tab of the Developer Dashboard, taken from
`apps/extension/manifest.config.ts` and the code. The permissions are pinned by
`apps/extension/src/privacy-guards.test.ts`. If the manifest changes, update this file.

---

## Single purpose

```
JobFill fills in job application forms from a profile the user saves in the extension. It reads the fields of the application form the user is on, fills the ones it recognises when the user clicks Autofill, and shows what it filled and what needs review. The user always submits the form themselves.
```

## Permission justifications

### `storage`

```
Stores the user's job-application profile (contact details, work and education history, skills, links), their resume file if they choose to keep it, and their settings in chrome.storage.local on their device. Nothing is synced or sent to a server. This is the only place JobFill keeps data, and "Delete all local data" in the extension erases it.
```

### Host permission: content script on `http://*/*` and `https://*/*` (all frames)

Chrome shows this as "Read and change all your data on all websites".

```
Job application forms live on thousands of different domains: company careers sites, applicant tracking systems, and forms embedded in iframes on job boards. There is no fixed list we could name in advance, so the content script must be able to run on http and https pages, including inside frames. It only reads form controls and their labels to work out what each field asks for (for example, "LinkedIn Profile URL"). It writes to the page only when the user clicks Autofill or Insert Answer in the popup. Autofill code is loaded only when the user asks for it. The script never submits forms or clicks buttons, and never sends page content anywhere. JobFill requests no host_permissions, no tabs, history or cookies permissions, and no optional permissions.
```

> Why not `activeTab` instead? Application forms often sit in cross-origin iframes. activeTab
> plus scripting would need extra permissions to reach them. Detection also has to follow forms
> that appear step by step before the user opens the popup. The broad match is the smaller
> permission set for this job. Reviewers ask about this, so keep this answer ready.

## Remote code

**Are you using remote code?** → **No, I am not using remote code.**

```
All JavaScript is bundled in the package. There are no remote scripts, no eval or new Function, and no dynamically fetched code. Extension pages use the default Manifest V3 content security policy (script-src 'self'). The optional AI feature sends a JSON request to the AI provider the user chose and gets JSON text back. It never executes the response.
```

The packaging script (`scripts/package-extension.mjs`) refuses to build a ZIP that contains
remote scripts, `eval`, `new Function`, source maps or dev-server references.

## Data usage

What JobFill handles, and whether it counts as "collected". Under Chrome Web Store policy,
data counts as collected when it is transmitted off the device. JobFill keeps data on the device,
except for the optional, user-started AI feature, which sends a user-approved subset directly to
the user's own AI provider. Tick these boxes to disclose that flow:

| Dashboard category                    | Tick? | Why                                                                                                                                                                                             |
| ------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personally identifiable information   | ✅    | The profile (name, email, phone, address) is stored locally. None of it is ever sent to AI (`NEVER_SENT_TO_AI`), but it's stored and entered into forms the user chooses, so disclose it.    |
| Health information                    | ❌    | Not asked for or stored. Disability questions are deliberately never answered.                                                                                                                 |
| Financial and payment information     | ❌    | Only an optional free-text "expected salary". No payment data. Salary is never sent to AI.                                                                                                     |
| Authentication information            | ✅    | The user's own AI API key (optional) is stored locally and sent only to the provider it belongs to.                                                                                            |
| Personal communications               | ❌    |                                                                                                                                                                                                 |
| Location                              | ✅    | City / state / country in the profile (stored locally, entered into forms). No GPS or IP geolocation.                                                                                          |
| Web history                           | ❌    | No browsing or application history is kept.                                                                                                                                                    |
| User activity                         | ❌    | No clicks, keystrokes or usage analytics are recorded.                                                                                                                                         |
| Website content                       | ✅    | When the user asks for an AI answer, the question text and the job posting's text (first 3,000 chars) from the current page are sent to their chosen AI provider.                             |

> Ticking PII and Location overstates what leaves the device, because those stay local. Google's
> guidance counts data the extension "handles" in some reviews, so over-disclosing is the safe
> choice. If you'd rather tick only what is transmitted (Authentication information and Website
> content, plus the work-history snippets the user approves for AI), keep the privacy policy
> wording exactly as it is. Both sides must agree.

### Certifications (tick all three; all are true)

- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.

"Approved use cases": the AI request goes to the provider the user configured and approved per
request. That is a user-initiated transfer needed for the feature they asked for.

### Privacy policy URL

```
⟨SITE_URL⟩/privacy
```

The text is in [PRIVACY_POLICY.md](PRIVACY_POLICY.md). The website's `/privacy` page must match it,
including the Limited Use sentence.
