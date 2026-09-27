/**
 * @jobfill/resume — résumé → profile, entirely on the device.
 * Text extraction (PDF, DOCX, TXT), a heuristic parser, and a review model that
 * never overwrites existing profile data without the user's approval.
 */
export { extractResumeText, ResumeTextError, type ExtractedText } from './extract-text';
export { pdfToText, parseToUnicode } from './pdf';
export { docxToText, documentXmlToText } from './docx';
export {
  parseResumeText,
  type ExtractedCertification,
  type ExtractedEducation,
  type ExtractedExperience,
  type ExtractedProject,
  type ExtractedResume,
} from './parse';
export { applyReview, buildReview, type EntryGroup, type ResumeReview, type ReviewItem, type ScalarPath } from './review';
