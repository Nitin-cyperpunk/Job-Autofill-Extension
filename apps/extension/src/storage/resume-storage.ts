import type { Profile, StoredResume } from '@jobfill/types';
import {
  STORAGE_KEYS,
  parseStoredResume,
  resumeMimeType,
  toResumeMeta,
  validateResumeFile,
} from '@jobfill/shared';
import { readFileAsBase64 } from '@/utils/file';
import { getItem, removeItem, setItems } from './local-storage';
import { loadProfile, stampProfile } from './profile-storage';

/**
 * The resume's bytes live under their own key so everyday profile reads and
 * change events stay small. Its metadata is mirrored on profile.resume, and both
 * keys are always written in a single storage call.
 */

export class ResumeError extends Error {}

export async function saveResume(file: File): Promise<Profile> {
  const problem = validateResumeFile(file);
  if (problem) throw new ResumeError(problem);

  const stored: StoredResume = {
    fileName: file.name,
    mimeType: resumeMimeType(file.name),
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    dataBase64: await readFileAsBase64(file),
  };
  const profile = stampProfile({ ...(await loadProfile()), resume: toResumeMeta(stored) });
  await setItems({ [STORAGE_KEYS.profile]: profile, [STORAGE_KEYS.resume]: stored });
  return profile;
}

export async function loadResume(): Promise<StoredResume | null> {
  return parseStoredResume(await getItem<unknown>(STORAGE_KEYS.resume));
}

export async function deleteResume(): Promise<Profile> {
  const profile = stampProfile({ ...(await loadProfile()), resume: null });
  await setItems({ [STORAGE_KEYS.profile]: profile });
  await removeItem(STORAGE_KEYS.resume);
  return profile;
}
