import type { SectionId } from '@jobfill/types';
import { useProfile } from '@/profile/profile-context';
import { SECTIONS } from './registry';

/** Read-only view of one saved section. */
export function SectionSummary<K extends SectionId>({ id }: { id: K }) {
  const { profile } = useProfile();
  const Summary = SECTIONS[id].Summary;
  return <Summary value={profile[id]} />;
}
