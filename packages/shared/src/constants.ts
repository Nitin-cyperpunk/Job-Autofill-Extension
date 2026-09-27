export const APP_NAME = 'JobFill';

/**
 * Keys used in chrome.storage.local. The version suffix changes only on breaking
 * layout changes; each bump needs a migration in storage/profile-storage.ts.
 */
export const STORAGE_KEYS = {
  profile: 'jobfill.profile.v2',
  resume: 'jobfill.resume.v1',
  settings: 'jobfill.settings.v1',
  /** Optional AI settings incl. the user's own API key. Read by the background worker (to call the provider) and the settings page (to edit them) — never by content scripts. */
  ai: 'jobfill.ai.v1',
  /** Phase-1 flat profile. Read once, migrated to `profile`, then removed. */
  legacyProfileV1: 'jobfill.profile.v1',
} as const;

/**
 * chrome.storage.local allows 10 MB without the unlimitedStorage permission.
 * Base64 inflates files by ~4/3, so 5 MB leaves ample room for the profile.
 */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_ACCEPTED_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Guard against pathological import files (resume + profile comfortably fit). */
export const IMPORT_MAX_BYTES = 12 * 1024 * 1024;
