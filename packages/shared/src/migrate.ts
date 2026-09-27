import type { Profile } from '@jobfill/types';
import { normalizeProfile } from './normalize';

/**
 * Phase-1 (v1) profile: flat personal/links/work sections and a top-level summary.
 * Typed loosely because it comes straight out of storage.
 */
interface ProfileV1 {
  personal?: Record<string, unknown>;
  links?: Record<string, unknown>;
  work?: Record<string, unknown>;
  summary?: unknown;
  updatedAt?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Convert a v1 profile to the current shape. Missing fields become empty values. */
export function migrateProfileV1(raw: unknown): Profile {
  const v1: ProfileV1 = isRecord(raw) ? raw : {};
  const work = isRecord(v1.work) ? v1.work : {};
  const profile = normalizeProfile({
    personal: v1.personal,
    professional: {
      currentTitle: work.currentTitle,
      currentCompany: work.currentCompany,
      yearsOfExperience: work.yearsOfExperience,
      expectedSalary: work.desiredSalary,
      noticePeriod: work.noticePeriod,
      workAuthorization: work.workAuthorization,
      requiresSponsorship: work.requiresSponsorship,
      willingToRelocate: work.willingToRelocate,
      summary: v1.summary,
    },
    links: v1.links,
    updatedAt: v1.updatedAt,
    createdAt: v1.updatedAt,
  });
  // A v1 user already saved a profile, so do not force them through onboarding again.
  if (profile.updatedAt) profile.onboardingCompletedAt = profile.updatedAt;
  return profile;
}
