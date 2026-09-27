import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '@jobfill/types';
import { computeCompleteness } from '@jobfill/shared';
import * as storage from '@/storage';
import { ProfileContext, type ProfileContextValue } from './profile-context';

/**
 * Loads the profile from chrome.storage.local and provides it to the tree.
 * Every action writes to storage and then updates state with the result;
 * chrome.storage.onChanged keeps other open pages (popup, other tabs) in sync.
 */
export function ProfileProvider({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    void storage.loadProfile().then((p) => {
      if (active) setProfile(p);
    });
    const unsubscribe = storage.onProfileChanged(setProfile);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<ProfileContextValue | null>(() => {
    if (!profile) return null;
    const apply = async (op: Promise<Profile>) => {
      const next = await op;
      setProfile(next);
      return next;
    };
    return {
      profile,
      completeness: computeCompleteness(profile),
      saveSection: (id, v) => apply(storage.saveSection(id, v)),
      completeOnboarding: () => apply(storage.completeOnboarding()),
      uploadResume: (file) => apply(storage.saveResume(file)),
      removeResume: () => apply(storage.deleteResume()),
      importProfile: (p, resume) => apply(storage.replaceProfile(p, resume)),
      resetProfile: () => apply(storage.resetProfile()),
      deleteAllData: () => apply(storage.deleteAllProfileData()),
      updateProfile: (mutate) => apply(storage.updateProfile(mutate)),
    };
  }, [profile]);

  if (!value) return <>{fallback ?? null}</>;
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
