import type { ResumeMeta } from './profile';

/** The resume file as persisted locally: metadata plus base64-encoded bytes. */
export interface StoredResume extends ResumeMeta {
  dataBase64: string;
}
