# JobFill FAQ

> Public FAQ. The website's `/faq` page should match these answers.

## The basics

**What is JobFill?**
A Chrome extension that fills in job application forms from a profile you save once. You check
the result and submit the application yourself.

**Is it free? Do I need an account?**
Yes, it's free, and no, there's no account. The optional AI feature uses your own API key, so any
AI costs are between you and your AI provider.

**Does JobFill submit applications for me?**
No. JobFill never submits a form and never clicks buttons on the page. You review everything and
click Submit yourself.

## Where it works

**Which job sites does it work on?**
JobFill reads each form's labels and hints to work out what a field asks for, so it doesn't need
a list of approved sites. It is tested against sample pages built like common application
systems (Greenhouse-, Lever- and Workday-style forms), Google Forms, and custom React forms,
including forms in embedded frames and multi-step forms. Real sites vary and change, so some
fields may be left for you. JobFill always tells you which ones.

**Which fields can it fill?**
Text, email, URL, phone and number boxes, text areas, dropdowns (standard, and many custom ones),
radio buttons, checkboxes and resume upload fields. That covers contact details, location, work
and education history, skills, languages, links (LinkedIn, GitHub, portfolio, website, X, a
resume link) and common screening questions your profile answers.

**Why wasn't a field filled?**
The popup's summary gives the reason for every field. Usually one of these applies:
- the field already had a value (JobFill never overwrites what you typed);
- it's a demographic, identity or consent question, which JobFill always leaves for you;
- your profile doesn't have that information yet;
- JobFill wasn't confident what the field was asking for;
- the site uses a custom widget that can't be filled automatically;
- the site cleared the value after it was entered. This shows as "Failed", and JobFill never
  reports it as filled.

**Why wasn't my resume attached?**
Some sites only accept files from their own upload button. JobFill shows **Attach Resume** in the
popup when a resume field wasn't filled. If the site still refuses, use its upload button and pick
your file. JobFill only says a resume was attached after checking the file is really in the form.

**It doesn't do anything on a page.**
Reload the tab. Pages opened before you installed JobFill need a reload. Chrome also blocks all
extensions on `chrome://` pages and the Chrome Web Store.

## Your data

**Where is my data stored?**
In your browser's extension storage on this device. It isn't synced, and it isn't sent to us.
JobFill has no servers.

**Does anything leave my device?**
Only if you use the optional AI feature, and only what you approve, to the provider you chose,
when you click Generate. Also remember that anything JobFill types into a form can be read by that
website, just as if you had typed it.

**Can I use JobFill on another computer?**
Yes. Export your profile (profile page → Export) and import the file in JobFill on the other
browser. There is no automatic sync.

**How do I delete my data?**
Profile page or Privacy settings → **Delete all local data**. Uninstalling JobFill also removes
it.

**Why does Chrome say JobFill can "read and change all your data on all websites"?**
Application forms live on thousands of different sites and are often embedded in other pages, so
JobFill has to be able to run on them. It reads form fields to understand them, and writes to a
page only when you click Autofill or Insert Answer. The only other permission is storage, for
your profile.

## Resume import

**Which resume formats work?**
PDF, DOCX and plain text, up to 5 MB. Scanned (image-only) PDFs and old `.doc` files can't be
read. Save as PDF or DOCX, or paste the text.

**Is my resume uploaded anywhere?**
No. It's read inside the extension on your device, and you approve every value before it's saved.

## AI answers (optional)

**Do I need AI to use JobFill?**
No. AI is off by default. Autofill and resume import work without it.

**Which AI providers are supported?**
OpenAI, Google Gemini, and OpenAI-compatible endpoints (for example, a model running on your own
computer). You provide your own API key.

**What does JobFill send to the AI?**
Only the question and the items you leave ticked on the consent screen, such as the job
description and relevant experience. Your name, contact details, links, salary, work-authorization
answers and resume file are never sent.

## Help

**How do I report a form that doesn't work?**
Email ⟨SUPPORT EMAIL⟩ with the site's address and which field went wrong. See [Support](SUPPORT.md).
