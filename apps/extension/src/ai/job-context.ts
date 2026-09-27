import type { JobContext } from '@jobfill/ai';
import { CONTROL_SELECTOR } from '@/field-detection/constants';
import { collapseWhitespace } from '@/field-detection/normalize';

/**
 * The job the user is applying for, read from the page (content script, read-only).
 * Used only as optional AI context the user sees and approves before anything is sent.
 */

const DESCRIPTION_SELECTORS = [
  '[data-automation-id*="jobPostingDescription" i]',
  '[class*="job-description" i]',
  '[id*="job-description" i]',
  '[class*="jobdescription" i]',
  '[class*="description" i]',
  '[id*="description" i]',
  '[class*="posting" i]',
  'article',
  'main',
];

function meta(doc: Document, name: string): string {
  return (
    doc
      .querySelector<HTMLMetaElement>(`meta[property="${name}"], meta[name="${name}"]`)
      ?.content?.trim() ?? ''
  );
}

function text(el: Element | null | undefined): string {
  return collapseWhitespace(el?.textContent);
}

/** The longest text block that isn't the form itself. */
function jobDescription(doc: Document): string {
  let best = '';
  for (const selector of DESCRIPTION_SELECTORS) {
    for (const el of doc.querySelectorAll(selector)) {
      // Skip containers that hold form fields: that's the application, not the posting.
      if (el.querySelector(CONTROL_SELECTOR) || el.closest('form')) continue;
      const t = text(el);
      if (t.length > best.length) best = t;
    }
    if (best.length > 400) break; // a specific selector found a real description
  }
  return best.slice(0, 6000);
}

export function extractJobContext(doc: Document = document): JobContext {
  const title = meta(doc, 'og:title') || text(doc.querySelector('h1')) || doc.title;
  const company = meta(doc, 'og:site_name') || meta(doc, 'application-name');
  const description = jobDescription(doc);
  return {
    ...(title ? { title: title.slice(0, 200) } : {}),
    ...(company ? { company: company.slice(0, 120) } : {}),
    ...(description ? { description } : {}),
  };
}
