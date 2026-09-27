import type { Profile, SectionId, SectionValue, StoredResume } from '@jobfill/types';
import {
  STORAGE_KEYS,
  createEmptyProfile,
  migrateProfileV1,
  normalizeProfile,
  toResumeMeta,
} from '@jobfill/shared';
import { clearAll, getItems, onItemChanged, removeItem, setItems } from './local-storage';

/** Set createdAt on first save and bump updatedAt on every save. */
export function stampProfile(profile: Profile): Profile {
  const now = new Date().toISOString();
  return { ...profile, createdAt: profile.createdAt ?? now, updatedAt: now };
}

/**
 * Load the profile, migrating a phase-1 (v1) profile the first time it is seen.
 * Always returns a well-formed Profile (empty if nothing is saved yet).
 */
export async function loadProfile(): Promise<Profile> {
  const data = await getItems([STORAGE_KEYS.profile, STORAGE_KEYS.legacyProfileV1]);
  if (data[STORAGE_KEYS.profile] !== undefined) return normalizeProfile(data[STORAGE_KEYS.profile]);

  if (data[STORAGE_KEYS.legacyProfileV1] !== undefined) {
    const migrated = migrateProfileV1(data[STORAGE_KEYS.legacyProfileV1]);
    await setItems({ [STORAGE_KEYS.profile]: migrated });
    await removeItem(STORAGE_KEYS.legacyProfileV1);
    return migrated;
  }
  return createEmptyProfile();
}

/** Read–modify–write against the latest stored profile, so unrelated sections are never clobbered. */
export async function updateProfile(mutate: (current: Profile) => Profile): Promise<Profile> {
  const next = stampProfile(mutate(await loadProfile()));
  await setItems({ [STORAGE_KEYS.profile]: next });
  return next;
}

export function saveSection<K extends SectionId>(id: K, value: SectionValue<K>): Promise<Profile> {
  return updateProfile((p) => ({ ...p, [id]: value }));
}

export function completeOnboarding(): Promise<Profile> {
  return updateProfile((p) => ({
    ...p,
    onboardingCompletedAt: p.onboardingCompletedAt ?? new Date().toISOString(),
  }));
}

/** Replace the whole profile (and resume) in a single write, e.g. after an import. */
export async function replaceProfile(
  profile: Profile,
  resume: StoredResume | null,
): Promise<Profile> {
  const next = stampProfile({ ...profile, resume: resume ? toResumeMeta(resume) : null });
  if (resume) {
    await setItems({ [STORAGE_KEYS.profile]: next, [STORAGE_KEYS.resume]: resume });
  } else {
    await setItems({ [STORAGE_KEYS.profile]: next });
    await removeItem(STORAGE_KEYS.resume);
  }
  return next;
}

/** Clear the profile and resume and start onboarding again. */
export async function resetProfile(): Promise<Profile> {
  await removeItem([STORAGE_KEYS.profile, STORAGE_KEYS.resume, STORAGE_KEYS.legacyProfileV1]);
  return createEmptyProfile();
}

/** Erase every JobFill key from this device. */
export async function deleteAllProfileData(): Promise<Profile> {
  await clearAll();
  return createEmptyProfile();
}

export function onProfileChanged(callback: (profile: Profile) => void): () => void {
  return onItemChanged<unknown>(STORAGE_KEYS.profile, (value) =>
    callback(value === undefined ? createEmptyProfile() : normalizeProfile(value)),
  );
}
