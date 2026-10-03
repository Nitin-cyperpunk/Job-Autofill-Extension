import type { Profile, SectionId } from '@jobfill/types';

export type CompletenessArea = SectionId | 'resume';

export interface CompletenessItem {
  id: CompletenessArea;
  label: string;
  /** Share of the total score this area is worth. Weights sum to 100. */
  weight: number;
  /** 0–1: how complete this area is. */
  score: number;
  /** Short, human hints for what would raise the score. */
  missing: string[];
}

/** An optional detail: shown as "not provided", never counted against the profile. */
export interface OptionalDetail {
  id: CompletenessArea;
  label: string;
  /** The part of the section it lives in (UI group), when the section is split up. */
  group?: string;
  provided: boolean;
}

export interface Completeness {
  /** Score of the core profile only — optional details never lower it. */
  percent: number;
  /** Core areas most applications need. */
  items: CompletenessItem[];
  /** True when every core area is complete. */
  coreComplete: boolean;
  /** Optional details many forms ask for but a résumé doesn't contain. */
  optional: OptionalDetail[];
}

function fraction(checks: Array<[boolean, string]>): { score: number; missing: string[] } {
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { score: (checks.length - missing.length) / checks.length, missing };
}

/**
 * Core vs optional. The score covers only what nearly every application needs (and
 * what a résumé import plus a minute of typing gives you). Address, date of birth,
 * gender, preferences, availability, work authorization and salary are listed as
 * optional details — skipping them is a valid choice, not an incomplete profile.
 */
export function computeCompleteness(profile: Profile): Completeness {
  const { personal: p, professional: pro, skills, links } = profile;

  const items: CompletenessItem[] = [
    {
      id: 'personal',
      label: 'Name & contact',
      weight: 30,
      ...fraction([
        [Boolean(p.firstName && p.lastName), 'Full name'],
        [Boolean(p.email), 'Email'],
        [Boolean(p.phone), 'Phone'],
      ]),
    },
    {
      id: 'resume',
      label: 'Resume',
      weight: 20,
      ...fraction([[profile.resume !== null, 'Upload your resume']]),
    },
    {
      id: profile.experience.length === 0 && profile.education.length > 0 ? 'education' : 'experience',
      label: 'Experience or education',
      weight: 25,
      ...fraction([
        [
          profile.experience.length > 0 || profile.education.length > 0,
          'A role or an education entry',
        ],
      ]),
    },
    {
      id: 'skills',
      label: 'Skills',
      weight: 15,
      score: Math.min(skills.technical.length, 3) / 3,
      missing: skills.technical.length >= 3 ? [] : ['At least 3 technical skills'],
    },
    {
      id: 'links',
      label: 'Professional link',
      weight: 10,
      ...fraction([
        [
          Boolean(links.linkedin || links.github || links.portfolio || links.x || links.website),
          'A profile link',
        ],
      ]),
    },
  ];

  const a = profile.additional;
  const optional: OptionalDetail[] = [
    { id: 'personal', label: 'Current address',
      group: 'current', provided: Boolean(p.address || p.city || p.postalCode) },
    {
      id: 'personal',
      label: 'Permanent address',
      group: 'permanent',
      provided: p.permanentSameAsCurrent === 'yes' || Boolean(p.permanentAddress.line1 || p.permanentAddress.city),
    },
    { id: 'personal', label: 'Date of birth',
      group: 'details', provided: Boolean(p.dateOfBirth) },
    { id: 'personal', label: 'Gender',
      group: 'details', provided: Boolean(p.gender) },
    { id: 'education', label: 'Education', provided: profile.education.length > 0 },
    { id: 'projects', label: 'Projects', provided: profile.projects.length > 0 },
    {
      id: 'professional',
      label: 'Job preferences',
      group: 'preferences',
      provided: Boolean(
        pro.preferredLocations.length || pro.preferredWorkMode || pro.willingToRelocate || pro.preferredJobTypes.length,
      ),
    },
    {
      id: 'professional',
      label: 'Availability',
      group: 'availability',
      provided: Boolean(pro.noticePeriod || pro.earliestStartDate),
    },
    {
      id: 'professional',
      label: 'Work authorization',
      group: 'authorization',
      provided: Boolean(pro.workAuthorization || pro.authorizedCountries.length || pro.requiresSponsorship),
    },
    {
      id: 'professional',
      label: 'Compensation',
      group: 'compensation',
      provided: Boolean(pro.currentSalary || pro.expectedSalary),
    },
    {
      id: 'additional',
      label: 'Additional information',
      provided: Object.values(a).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))),
    },
  ];

  const total = items.reduce((sum, item) => sum + item.weight * item.score, 0);
  return {
    percent: Math.round(total),
    items,
    coreComplete: items.every((item) => item.score === 1),
    optional,
  };
}
