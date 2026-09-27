# JobFill Support

> Public support page text. Host it at `⟨SITE_URL⟩/support`, or use it as the "Support" tab text
> in the Chrome Web Store dashboard. Replace ⟨SUPPORT EMAIL⟩ first. The store expects a working
> contact.

## Get help

Email **⟨SUPPORT EMAIL⟩**. We usually reply within ⟨N⟩ working days.

To help us fix a form that didn't fill properly, please include:

1. **The page address.** Send just the domain if you prefer, for example `jobs.example.com`.
2. **Which field** wasn't filled or was filled wrongly, and what you expected.
3. **Your Chrome version** (`chrome://version`) and your JobFill version (on `chrome://extensions`).
4. **Optional:** a screenshot of JobFill's popup. With **Debug mode** on (profile page → Advanced),
   the popup shows how each field was understood.

**Please don't send your resume, your profile export or your API key.** We never need them to
help you.

## Quick fixes

- **JobFill doesn't react on a page.** Reload the tab. Tabs that were open before you installed
  JobFill need a reload. Chrome doesn't let extensions run on `chrome://` pages or the Chrome
  Web Store.
- **A field wasn't filled.** Open the popup after autofill. The summary lists each field and why
  it was left alone: it already had a value, it's a legal or personal question JobFill leaves for
  you, JobFill wasn't sure what it asked for, or the site uses a widget that can't be filled
  automatically.
- **The resume wasn't attached.** Some sites only accept files from their own upload button.
  Click **Attach Resume** in the popup. If that doesn't work either, use the site's upload button
  and choose your file.
- **My resume won't import.** Scanned (image-only) PDFs and old `.doc` files can't be read. Save
  it as PDF or DOCX, or choose **Paste text instead**.
- **AI answers don't work.** Check your API key and model in the AI settings, and that your
  provider account has credit. The popup's error message says what went wrong, for example an
  invalid key or a rate limit.

See the [FAQ](FAQ.md) for more.

## Report a security issue

Email ⟨SUPPORT EMAIL⟩ with "Security" in the subject line. Please don't post security issues
publicly until we've replied.
