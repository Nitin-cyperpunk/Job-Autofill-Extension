import { createContext, useContext } from 'react';
import type { Profile, SectionId, SectionValue, StoredResume } from '@jobfill/types';
import type { Completeness } from '@jobfill/shared';

/**
 * React binding for the locally stored profile (see ProfileProvider). Kept out of
 * profile/index.ts so the content script bundle never pulls in React.
 */
export interface ProfileContextValue {
  profile: Profile;
  completeness: Completeness;
  saveSection: <K extends SectionId>(id: K, value: SectionValue<K>) => Promise<Profile>;
  completeOnboarding: () => Promise<Profile>;
  uploadResume: (file: File) => Promise<Profile>;
  removeResume: () => Promise<Profile>;
  importProfile: (profile: Profile, resume: StoredResume | null) => Promise<Profile>;
  resetProfile: () => Promise<Profile>;
  deleteAllData: () => Promise<Profile>;
  /** Read–modify–write against the latest stored profile (e.g. applying a résumé review). */
  updateProfile: (mutate: (current: Profile) => Profile) => Promise<Profile>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}
