import type { SectionId } from '@jobfill/types';
import { useProfile } from '@/profile/profile-context';
import { SECTIONS } from './registry';

/** Read-only view of one saved section (or just some of its groups). */
export function SectionSummary<K extends SectionId>({
  id,
  groups,
}: {
  id: K;
  groups?: readonly string[];
}) {
  const { profile } = useProfile();
  const Summary = SECTIONS[id].Summary;
  return <Summary value={profile[id]} groups={groups} />;
}
