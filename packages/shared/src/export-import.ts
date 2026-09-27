import {
  PROFILE_EXPORT_FORMAT,
  PROFILE_SCHEMA_VERSION,
  type Profile,
  type ProfileExportFile,
  type StoredResume,
} from '@jobfill/types';
import { migrateProfileV1 } from './migrate';
import { normalizeProfile, parseStoredResume } from './normalize';
import { RESUME_MAX_BYTES } from './constants';
import { toResumeMeta } from './resume';

export function buildExportFile(profile: Profile, resume: StoredResume | null): ProfileExportFile {
  return {
    format: PROFILE_EXPORT_FORMAT,
    version: PROFILE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    // Keep the metadata consistent with what is actually inside the file.
    profile: resume ? profile : { ...profile, resume: null },
    resume,
  };
}

export function exportFileName(date = new Date()): string {
  return `jobfill-profile-${date.toISOString().slice(0, 10)}.json`;
}

export type ImportResult =
  | { ok: true; profile: Profile; resume: StoredResume | null; warnings: string[] }
  | { ok: false; error: string };

/** Parse an exported file. Untrusted input: everything is normalised, nothing is eval'd. */
export function parseImportFile(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file isn’t valid JSON. Choose a file exported from JobFill.' };
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'This doesn’t look like a JobFill profile export.' };
  }
  const file = data as Partial<Record<keyof ProfileExportFile, unknown>>;
  if (file.format !== PROFILE_EXPORT_FORMAT) {
    return { ok: false, error: 'This doesn’t look like a JobFill profile export.' };
  }
  if (typeof file.version !== 'number' || file.version > PROFILE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'This file was exported by a newer version of JobFill. Update the extension first.',
    };
  }
  if (typeof file.profile !== 'object' || file.profile === null) {
    return { ok: false, error: 'This file doesn’t contain a profile.' };
  }

  const warnings: string[] = [];
  const profile =
    file.version < PROFILE_SCHEMA_VERSION
      ? migrateProfileV1(file.profile)
      : normalizeProfile(file.profile);

  let resume: StoredResume | null = null;
  if (file.resume != null) {
    resume = parseStoredResume(file.resume);
    if (!resume) {
      warnings.push('The resume in this file was unreadable and was skipped.');
    } else if (resume.sizeBytes > RESUME_MAX_BYTES) {
      warnings.push('The resume in this file is larger than 5 MB and was skipped.');
      resume = null;
    }
  }
  // Metadata always mirrors the file actually imported (or its absence).
  profile.resume = resume ? toResumeMeta(resume) : null;

  return { ok: true, profile, resume, warnings };
}
