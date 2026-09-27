import { readDocx } from './docx';
import { readPdf } from './pdf';

export class ResumeTextError extends Error {}

export interface ExtractedText {
  text: string;
  format: 'pdf' | 'docx' | 'text';
  /** Hyperlink targets that aren't in the visible text (PDF / DOCX links). */
  links: string[];
}

/**
 * Turn a résumé file into plain text on this device. PDF and DOCX are parsed
 * locally; legacy .doc isn't (it needs a full Word binary parser) — users are asked
 * to save as PDF/DOCX or paste the text instead.
 */
export async function extractResumeText(
  bytes: Uint8Array,
  fileName: string,
): Promise<ExtractedText> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  let text: string;
  let links: string[] = [];
  let format: ExtractedText['format'];
  if (ext === 'pdf') {
    ({ text, links } = await readPdf(bytes));
    format = 'pdf';
  } else if (ext === 'docx') {
    ({ text, links } = await readDocx(bytes));
    format = 'docx';
  } else if (ext === 'txt' || ext === 'md') {
    text = new TextDecoder().decode(bytes);
    format = 'text';
  } else if (ext === 'doc') {
    throw new ResumeTextError(
      'Old Word (.doc) files can’t be read on your device. Save it as PDF or DOCX, or paste the text.',
    );
  } else {
    throw new ResumeTextError('Use a PDF, DOCX or TXT file — or paste the text.');
  }
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  if (letters < 40) {
    throw new ResumeTextError(
      format === 'pdf'
        ? 'No readable text found — this PDF may be a scanned image. Paste the text instead.'
        : 'No readable text found in this file. Paste the text instead.',
    );
  }
  return { text, format, links };
}
