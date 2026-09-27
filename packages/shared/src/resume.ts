import type { ResumeMeta, StoredResume } from '@jobfill/types';
import { RESUME_ACCEPTED_TYPES, RESUME_MAX_BYTES } from './constants';

export const RESUME_ACCEPT_ATTR = Object.keys(RESUME_ACCEPTED_TYPES)
  .map((ext) => `.${ext}`)
  .concat(Object.values(RESUME_ACCEPTED_TYPES))
  .join(',');

/** Returns a user-facing error, or null when the file is acceptable. */
export function validateResumeFile(file: { name: string; size: number }): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!(ext in RESUME_ACCEPTED_TYPES)) return 'Upload a PDF, DOC or DOCX file.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > RESUME_MAX_BYTES) return 'Resumes must be 5 MB or smaller.';
  return null;
}

/** Derive a reliable MIME type from the extension (browsers sometimes report ""). */
export function resumeMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return RESUME_ACCEPTED_TYPES[ext] ?? 'application/octet-stream';
}

export function toResumeMeta(resume: StoredResume): ResumeMeta {
  const { fileName, mimeType, sizeBytes, uploadedAt } = resume;
  return { fileName, mimeType, sizeBytes, uploadedAt };
}
