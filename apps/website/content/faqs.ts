import type { Faq } from '@/lib/schema';

/**
 * FAQ content, grouped. Pages pick the questions relevant to them; /faq shows all.
 * Every answer must describe what the extension actually does today.
 */

export const GENERAL_FAQS = {
  howItWorks: {
    q: 'How does JobFill autofill job applications?',
    a: 'You save your profile once in the extension. On an application form, click the JobFill icon and choose Autofill Application: JobFill reads each field’s label and surrounding text, matches it to your profile, fills what it is confident about, checks the page kept each value, and lists anything that needs your review. You submit the application yourself.',
  },
  fields: {
    q: 'What information can JobFill autofill?',
    a: 'Your name, email and phone (including separate country-code fields), current and permanent address, education, work experience, projects, skills, LinkedIn, GitHub, portfolio and other profile links, salary and notice period, job preferences, and your resume file on standard upload fields. Optional answers you add — such as date of birth, gender or work authorization — are used only exactly as you entered them.',
  },
  what: {
    q: 'What is JobFill?',
    a: 'JobFill is a Chrome extension that fills in job application forms for you. You save your details once — personal information, education, experience, skills and links — and JobFill fills matching fields on application forms when you click Autofill. You review everything and submit the application yourself.',
  },
  free: {
    q: 'Is JobFill free?',
    a: 'Yes. JobFill has no paid plans, no accounts and no payments. The only possible cost is optional: if you turn on AI-drafted answers, you use your own API key and your AI provider bills you for that usage.',
  },
  browsers: {
    q: 'Which browsers does JobFill work in?',
    a: 'JobFill is built and tested for Google Chrome on desktop (Windows, macOS, Linux and ChromeOS). It is a standard Manifest V3 extension; other Chromium-based browsers that install Chrome Web Store extensions may work, but Chrome is the supported browser.',
  },
  account: {
    q: 'Do I need to create an account?',
    a: 'No. There is no sign-up and no login. Your profile is created and stored inside the extension on your own device.',
  },
  submit: {
    q: 'Does JobFill submit applications for me?',
    a: 'No, never. JobFill fills fields and shows you a summary of what it filled and what needs your review. Submitting is always your decision and your click.',
  },
  sites: {
    q: 'Which job sites and forms does JobFill work with?',
    a: 'JobFill fills standard web forms, and is designed for the patterns common on application forms: Google Forms, Greenhouse- and Lever-style application pages, Workday-style multi-step forms, custom dropdowns, forms inside iframes and modern JavaScript forms. No autofill tool handles every form perfectly — when JobFill isn’t sure about a field, it leaves it for you and tells you so. Tested on sample pages built like these platforms — live sites change, so some fields may need manual entry.',
  },
  sensitive: {
    q: 'Will JobFill answer diversity, identity or consent questions?',
    a: 'Only with answers you have explicitly added to your profile. Gender, date of birth, disability, veteran status, ethnicity and work-authorization questions are optional profile fields: if you leave them empty, JobFill leaves the question for you and never guesses. Consent and declaration checkboxes are never ticked for you.',
  },
} satisfies Record<string, Faq>;

export const PRIVACY_FAQS = {
  where: {
    q: 'Where is my profile stored?',
    a: 'In your browser’s extension storage (chrome.storage.local) on the device you’re using. It is not synced to your Google account and there is no JobFill server that holds a copy.',
  },
  leave: {
    q: 'Does my data ever leave my device?',
    a: 'Only when you use a feature that needs it to. Autofill puts your details into the form you’re filling, where that website can read them just as if you had typed them. If you turn on optional AI answers, the details you approve for one question are sent to the AI provider you chose. Export saves a file to your computer. Nothing else is sent anywhere.',
  },
  analytics: {
    q: 'Does JobFill track me or collect analytics?',
    a: 'The extension contains no analytics, telemetry, advertising or crash-reporting code — it can’t see or report what you do. This website uses Vercel Web Analytics to count page visits (which pages, referrer, country and device type), without cookies and without identifying you across sites. It never sees your profile.',
  },
  delete: {
    q: 'How do I delete my data?',
    a: 'Open JobFill’s Privacy settings and choose “Delete all local data”. That erases your profile, saved resume, settings and any AI API key from this device. Uninstalling the extension also removes its stored data.',
  },
  permissions: {
    q: 'Why does JobFill need access to the websites I visit?',
    a: 'Application forms live on thousands of different sites, often inside embedded frames, so JobFill’s form reader needs to run on web pages to find fields. It reads form fields and their labels, sends nothing on its own, and only writes to a page when you click Autofill or Insert Answer. The only other permission it asks for is storage, to save your profile.',
  },
} satisfies Record<string, Faq>;

export const AUTOFILL_FAQS = {
  matching: {
    q: 'How does JobFill know which field is which?',
    a: 'It reads each field’s label, name, autocomplete hints, placeholder and nearby text, then matches them to your profile with a deterministic dictionary of the ways application forms ask for things (“Given name”, “Mobile number”, “LinkedIn URL”…). Each match gets a confidence level; uncertain fields are left for your review. No AI is used for autofill.',
  },
  preview: {
    q: 'Can I check what JobFill will fill before it fills anything?',
    a: 'Yes. Turn on “Preview fields before filling” and JobFill lists every field it detected with the value it plans to use. Untick anything you don’t want, then fill.',
  },
  existing: {
    q: 'Will autofill overwrite what I already typed?',
    a: 'No. Fields that already contain a value are left alone.',
  },
  dropdowns: {
    q: 'Does it work with dropdowns, radio buttons and checkboxes?',
    a: 'Yes — standard selects, radio groups and checkboxes, and custom dropdowns built from accessible combobox and listbox components, which many applicant tracking systems use. It picks the option that matches your profile and never clicks submit-type buttons while doing so.',
  },
  multistep: {
    q: 'What about multi-step application forms?',
    a: 'Click Autofill on each step. JobFill also notices fields that appear because of an answer it filled (for example a “please give details” box) and fills those too.',
  },
  resume: {
    q: 'Can JobFill attach my resume to the application?',
    a: 'If you saved your resume file in JobFill, it can attach it to resume upload fields that use a standard file input. Some sites block uploads from extensions: JobFill then shows an Attach Resume button, and if that also fails, attach the file with the site’s own upload button.',
  },
} satisfies Record<string, Faq>;

export const RESUME_FAQS = {
  formats: {
    q: 'Which resume formats can JobFill read?',
    a: 'PDF, Word (.docx) and plain text files up to 5 MB. PDFs need to contain real text — a scanned image of a resume has no text to read, so JobFill will tell you and let you paste the text instead. Older .doc files can’t be read either — save as .docx or PDF, or paste the text.',
  },
  upload: {
    q: 'Is my resume uploaded to a server to be parsed?',
    a: 'No. The resume parser runs inside the extension on your computer. The file is not uploaded anywhere to extract your details.',
  },
  overwrite: {
    q: 'Will importing a resume overwrite my profile?',
    a: 'Not without your say-so. You review every detail found before anything is saved. Where your resume disagrees with your existing profile, JobFill shows both values side by side and keeps your existing value unless you choose the resume’s.',
  },
} satisfies Record<string, Faq>;

export const AI_FAQS = {
  howAi: {
    q: 'How do JobFill’s AI features work?',
    a: 'AI answers are optional and off by default. For an open question like “Why do you want to work here?”, JobFill shows exactly what it would send — the question, job details from the page and the profile items you tick — and only after you click Generate Answer does it send that to the AI provider you configured. You get draft answers to edit; nothing is inserted until you choose one.',
  },
  needKey: {
    q: 'Do I need an AI API key?',
    a: 'No. Autofill, resume import, preview and every other core feature work without any AI. Only the optional AI answers need a key: you use your own (bring-your-own-key) from OpenAI, Google Gemini or an OpenAI-compatible endpoint, stored only in your browser.',
  },
  required: {
    q: 'Do I have to use AI?',
    a: 'No. AI answers are optional and off by default. Autofill, resume import and everything else work without AI.',
  },
  providers: {
    q: 'Which AI providers can I use?',
    a: 'OpenAI, Google Gemini, or any OpenAI-compatible endpoint — including a model server running on your own computer. You use your own API key.',
  },
  sent: {
    q: 'What does JobFill send to the AI provider?',
    a: 'Only what one question needs, and only after you see it and click Generate Answer: the question, the job title, company and description from the page, and the profile details you leave ticked (such as relevant skills and experience highlights). Your name, contact details, address, links, salary, work authorization, demographic answers and resume file are never sent.',
  },
  history: {
    q: 'Does JobFill keep my AI answers?',
    a: 'No. Generated answers exist only while the JobFill popup is open. Your AI provider may keep its own records under its own policy.',
  },
  key: {
    q: 'Where is my API key stored?',
    a: 'Only in your browser’s extension storage on your device. It is sent only to the provider you chose, and you can remove it at any time from Privacy settings.',
  },
} satisfies Record<string, Faq>;

export const TROUBLESHOOTING_FAQS = {
  notFilled: {
    q: 'Why wasn’t a field filled?',
    a: 'JobFill leaves a field alone when it already has a value, when it’s a personal, demographic or legal question you haven’t answered in your profile, when it’s a consent box, when it isn’t confident what the field is asking for, when your profile doesn’t have that detail yet, or when the site uses a custom control it can’t operate safely. The summary after each fill lists the fields that need your review.',
  },
  resume: {
    q: 'Why wasn’t my resume attached?',
    a: 'Some sites block file uploads from extensions or use their own upload widget. JobFill then shows an Attach Resume button in the summary; if that also fails, attach the file with the site’s own upload button. Google Forms uploads always go through Google’s file picker.',
  },
  noResponse: {
    q: 'JobFill doesn’t respond on a page. What can I do?',
    a: 'Reload the tab — pages that were already open when you installed JobFill need a reload before it can read them. Chrome also doesn’t allow extensions on its own pages (such as chrome:// settings), the Chrome Web Store, or other extensions’ pages.',
  },
  importFails: {
    q: 'My resume won’t import. Why?',
    a: 'JobFill reads PDF, .docx and plain text files up to 5 MB. Older .doc files and scanned, image-only PDFs have no text it can read. Save your resume as .docx or a text-based PDF, or paste the text into the import screen.',
  },
  report: {
    q: 'How do I report a form that doesn’t fill correctly?',
    a: 'Send the page’s address and the field that didn’t fill using the contact details on the Support page. A screenshot of JobFill’s debug panel helps a lot — turn on Debug mode under Advanced on your profile page, then open the popup on that form.',
  },
  devices: {
    q: 'Can I use JobFill on more than one device?',
    a: 'JobFill doesn’t sync, so your profile stays in the browser where you created it. To move it, use Export profile, then Import profile in the other browser.',
  },
} satisfies Record<string, Faq>;

export const FAQ_GROUPS: Array<{ id: string; title: string; faqs: Faq[] }> = [
  {
    id: 'general',
    title: 'General',
    faqs: [
      GENERAL_FAQS.what,
      GENERAL_FAQS.howItWorks,
      GENERAL_FAQS.fields,
      ...Object.values(GENERAL_FAQS).filter(
        (f) =>
          f !== GENERAL_FAQS.what && f !== GENERAL_FAQS.howItWorks && f !== GENERAL_FAQS.fields,
      ),
    ],
  },
  { id: 'privacy', title: 'Privacy and data', faqs: Object.values(PRIVACY_FAQS) },
  { id: 'autofill', title: 'Autofill', faqs: Object.values(AUTOFILL_FAQS) },
  { id: 'resume', title: 'Resume import', faqs: Object.values(RESUME_FAQS) },
  { id: 'ai', title: 'AI answers', faqs: Object.values(AI_FAQS) },
  { id: 'troubleshooting', title: 'Troubleshooting', faqs: Object.values(TROUBLESHOOTING_FAQS) },
];
