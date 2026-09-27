# Chrome Web Store listing — JobFill

Copy for the **Store listing** tab of the Chrome Web Store Developer Dashboard. Everything below
describes what version 0.1.0 does today, checked against the code and tests. Don't add claims
the extension can't back up (see "Wording rules" at the end).

---

## Title (from `manifest.json` → `name`, 75 chars max)

```
JobFill — Job Application Autofill
```

## Short description (from `manifest.json` → `description`, 132 chars max)

```
Save your profile once and autofill job applications in seconds.
```

Both are pinned by `apps/extension/src/store-listing.test.ts`. To change them, edit
`apps/extension/manifest.config.ts` and the test together.

## Category and language

- **Category:** Productivity → Workflow & Planning
- **Language:** English

## Detailed description (paste as-is; plain text, 16,000 chars max)

```
JobFill fills in job application forms for you from a profile you save once. You stay in control: you see what was filled, you review it, and you submit the application yourself.

HOW IT WORKS
1. Create your profile. Upload your resume (PDF, DOCX or TXT) and JobFill reads it on your device to fill in your details, or type them in section by section. Add your LinkedIn, portfolio, GitHub and X profile links and a link to your resume.
2. Open a job application form and click the JobFill icon.
3. Click Autofill Application. JobFill fills the fields it recognises and shows a summary: what it filled, what needs your review, and what it left alone.
4. Check the form and submit it yourself. JobFill never submits an application.

WHAT JOBFILL CAN FILL
• Contact details: name, email, phone, address and location
• Work and education history, skills and languages
• Links: LinkedIn, GitHub, portfolio, personal website, X/Twitter and a resume link (for example Google Drive)
• Common screening questions your profile answers, such as years of experience, notice period and willingness to relocate
• Your resume file, in upload fields that accept files from extensions. If a site blocks this, JobFill tells you and offers an "Attach Resume" button. You can always attach the file yourself.
Supported field types: text, email, URL, phone and number inputs, text areas, dropdowns (standard, and many custom ones), radio buttons, checkboxes and file uploads. JobFill also works with forms inside embedded frames and forms that appear step by step.

WHERE IT WORKS
JobFill reads the labels and hints on a form to work out what each field asks for, rather than relying on fixed rules for particular sites. It is tested against sample pages built like common application systems (Greenhouse-, Lever- and Workday-style forms), Google Forms, and custom forms built with React. Every site is different and sites change, so some fields may be left for you to fill, and some custom widgets can't be filled automatically. JobFill always tells you which fields need your attention.

WHAT JOBFILL WON'T DO
• It never submits an application or clicks buttons on the page.
• It doesn't answer demographic, identity or consent questions for you (for example gender, ethnicity, veteran or disability status, or "I agree" boxes).
• It doesn't overwrite answers you've already typed.
• It only marks a field "Filled" after checking that the page kept the value.

PREVIEW MODE
Turn on "Preview fields before filling" to see every value first and choose which fields to fill.

YOUR DATA STAYS ON YOUR DEVICE
• Your profile and resume are stored in this browser's extension storage. They are not synced, and nothing is sent to JobFill. JobFill has no servers or accounts.
• No analytics, no tracking, no ads.
• Export your profile to a file, import it in another browser, or delete everything with one click.
• Values JobFill enters into a form can be read by that website, just as if you had typed them.

OPTIONAL: AI-DRAFTED ANSWERS (OFF BY DEFAULT)
For open questions like "Why do you want to work here?", you can ask AI to draft an answer. This uses your own API key for OpenAI, Google Gemini or an OpenAI-compatible endpoint you choose. Nothing is sent until you click Generate for a specific question. A consent screen first shows exactly what will be sent and where, and you can untick anything. Your name, contact details, links, salary and resume file are never sent. Answers are drafts: you edit and insert them yourself.

RESUME IMPORT LIMITS
Resumes up to 5 MB. Scanned (image-only) PDFs and old .doc files can't be read. Save as PDF or DOCX, or paste the text instead.

PERMISSIONS
Chrome will say JobFill can "Read and change all your data on all websites". JobFill needs this to find and fill application forms on the sites you apply on, including forms embedded in other pages. It reads form fields only to work out what they ask for, and writes to a page only when you click Autofill or Insert Answer. The only other permission is storage, used to keep your profile on your device.

Free, with no account needed.
Privacy policy: ⟨SITE_URL⟩/privacy
Help and FAQ: ⟨SITE_URL⟩/support
```

> Before pasting, replace `⟨SITE_URL⟩` with the real domain. See the launch checklist.

## Graphic assets

All in [`assets/`](assets/). Regenerate with `node scripts/store/make-assets.mjs` (see the script header).

| Dashboard slot               | File                                 | Size     | Required |
| ---------------------------- | ------------------------------------ | -------- | -------- |
| Store icon                   | `store-icon-128.png`                 | 128×128  | yes      |
| Screenshot 1                 | `screenshot-1-autofill.png`          | 1280×800 | yes (≥1) |
| Screenshot 2                 | `screenshot-2-preview.png`           | 1280×800 |          |
| Screenshot 3                 | `screenshot-3-profile.png`           | 1280×800 |          |
| Screenshot 4                 | `screenshot-4-resume-import.png`     | 1280×800 |          |
| Screenshot 5                 | `screenshot-5-privacy.png`           | 1280×800 |          |
| Small promo tile             | `promo-small-440x280.png`            | 440×280  | yes      |
| Marquee promo tile           | `promo-marquee-1400x560.png`         | 1400×560 | optional |

The icon uses 96×96 artwork centred on a transparent 128×128 canvas, as the store asks. The
manifest's 128 px icon is the same file. The screenshots show fictional sample data (Ada
Lovelace, "Northwind Labs") on a local test page. They show no real company or person.

## Wording rules for the listing, the website and replies to reviews

- Never say it works on "any", "every" or "all" sites, forms or ATSs. Say "tested on sample pages
  built like …" and "some fields may need you".
- Never say data "never leaves your device" without mentioning the optional AI feature.
- Don't name real companies' products as supported, and don't use their logos. "Greenhouse-style"
  describes our fixtures; it isn't an endorsement or partnership.
- No user counts, ratings, reviews, "#1" or time-saved numbers.
