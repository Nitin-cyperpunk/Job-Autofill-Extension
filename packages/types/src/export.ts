import type { Profile } from './profile';
import type { StoredResume } from './resume';

export const PROFILE_EXPORT_FORMAT = 'jobfill.profile';

/** Shape of the JSON file produced by "Export profile" and accepted by "Import profile". */
export interface ProfileExportFile {
  format: typeof PROFILE_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  profile: Profile;
  resume: StoredResume | null;
}
