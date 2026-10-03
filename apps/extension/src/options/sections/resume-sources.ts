import { useContext, useMemo } from 'react';
import { ProfileContext } from '@/profile/profile-context';

/** Profile paths last filled by a résumé import (empty outside a ProfileProvider). */
export function useResumeSources(): ReadonlySet<string> {
  const paths = useContext(ProfileContext)?.profile.sources.resume;
  return useMemo(() => new Set(paths ?? []), [paths]);
}
