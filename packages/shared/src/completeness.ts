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

export interface Completeness {
  percent: number;
  items: CompletenessItem[];
}

function fraction(checks: Array<[boolean, string]>): { score: number; missing: string[] } {
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  return { score: (checks.length - missing.length) / checks.length, missing };
}

/**
 * Weighted towards what job applications ask for most. Deliberately simple and
 * explainable: every point maps to a concrete hint shown in the UI.
 */
export function computeCompleteness(profile: Profile): Completeness {
  const { personal: p, professional: pro, skills, links } = profile;

  const items: CompletenessItem[] = [
    {
      id: 'personal',
      label: 'Personal information',
      weight: 25,
      ...fraction([
        [Boolean(p.firstName && p.lastName), 'Full name'],
        [Boolean(p.email), 'Email'],
        [Boolean(p.phone), 'Phone'],
        [Boolean(p.city || p.country), 'Location'],
      ]),
    },
    {
      id: 'professional',
      label: 'Professional details',
      weight: 15,
      ...fraction([
        [Boolean(pro.currentTitle), 'Current job title'],
        [Boolean(pro.summary), 'Professional summary'],
        [Boolean(pro.yearsOfExperience), 'Years of experience'],
        [Boolean(pro.workAuthorization), 'Work authorization'],
      ]),
    },
    {
      id: 'education',
      label: 'Education',
      weight: 10,
      ...fraction([[profile.education.length > 0, 'At least one education entry']]),
    },
    {
      id: 'experience',
      label: 'Experience',
      weight: 15,
      ...fraction([[profile.experience.length > 0, 'At least one role']]),
    },
    {
      id: 'projects',
      label: 'Projects',
      weight: 5,
      ...fraction([[profile.projects.length > 0, 'At least one project']]),
    },
    {
      id: 'skills',
      label: 'Skills',
      weight: 10,
      score: Math.min(skills.technical.length, 3) / 3,
      missing: skills.technical.length >= 3 ? [] : ['At least 3 technical skills'],
    },
    {
      id: 'links',
      label: 'Links',
      weight: 10,
      ...fraction([
        [
          Boolean(links.linkedin || links.github || links.portfolio || links.x || links.website),
          'A profile link',
        ],
      ]),
    },
    {
      id: 'resume',
      label: 'Resume',
      weight: 10,
      ...fraction([[profile.resume !== null, 'Upload your resume']]),
    },
  ];

  const total = items.reduce((sum, item) => sum + item.weight * item.score, 0);
  return { percent: Math.round(total), items };
}
