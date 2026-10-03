import type { Profile } from '@jobfill/types';
import {
  createEducationEntry,
  createExperienceEntry,
  createId,
  createProjectEntry,
  formatDateRange,
} from '@jobfill/shared';
import type { ExtractedResume } from './parse';

/**
 * Turning an extracted résumé into reviewable changes — never silent overwrites.
 *
 *  - new       existing field is empty            → pre-accepted
 *  - conflict  existing value differs             → pre-set to KEEP existing
 *  - same      nothing to do                      → not shown
 *  - entries   roles / degrees / projects / certs  → only ever added; duplicates pre-unticked
 *  - tags      skills / languages                 → added individually
 */

export type ScalarPath =
  | 'personal.firstName'
  | 'personal.middleName'
  | 'personal.lastName'
  | 'personal.email'
  | 'personal.phone'
  | 'personal.city'
  | 'personal.state'
  | 'personal.country'
  | 'professional.currentTitle'
  | 'professional.currentCompany'
  | 'professional.yearsOfExperience'
  | 'professional.summary'
  | 'links.resumeUrl'
  | 'links.linkedin'
  | 'links.github'
  | 'links.portfolio'
  | 'links.x'
  | 'links.website';

const SCALARS: Array<{
  path: ScalarPath;
  label: string;
  group: 'Personal' | 'Professional' | 'Links';
}> = [
  { path: 'personal.firstName', label: 'First name', group: 'Personal' },
  { path: 'personal.middleName', label: 'Middle name', group: 'Personal' },
  { path: 'personal.lastName', label: 'Last name', group: 'Personal' },
  { path: 'personal.email', label: 'Email', group: 'Personal' },
  { path: 'personal.phone', label: 'Phone', group: 'Personal' },
  { path: 'personal.city', label: 'City', group: 'Personal' },
  { path: 'personal.state', label: 'State / Province', group: 'Personal' },
  { path: 'personal.country', label: 'Country', group: 'Personal' },
  { path: 'professional.currentTitle', label: 'Current job title', group: 'Professional' },
  { path: 'professional.currentCompany', label: 'Current company', group: 'Professional' },
  {
    path: 'professional.yearsOfExperience',
    label: 'Years of experience (from dates)',
    group: 'Professional',
  },
  { path: 'professional.summary', label: 'Professional summary', group: 'Professional' },
  { path: 'links.resumeUrl', label: 'Resume link', group: 'Links' },
  { path: 'links.linkedin', label: 'LinkedIn', group: 'Links' },
  { path: 'links.portfolio', label: 'Portfolio', group: 'Links' },
  { path: 'links.github', label: 'GitHub', group: 'Links' },
  { path: 'links.x', label: 'X / Twitter', group: 'Links' },
  { path: 'links.website', label: 'Website', group: 'Links' },
];

export type EntryGroup = 'experience' | 'education' | 'projects' | 'certifications';

export type ReviewItem =
  | {
      kind: 'scalar';
      id: ScalarPath;
      group: 'Personal' | 'Professional' | 'Links';
      label: string;
      existing: string;
      extracted: string;
      status: 'new' | 'conflict';
    }
  | {
      kind: 'entry';
      id: string;
      group: EntryGroup;
      title: string;
      subtitle: string;
      details: string;
      /** Title of the existing entry this looks like, if any. */
      duplicateOf: string | null;
      note: string;
    }
  | { kind: 'tag'; id: string; group: 'skills' | 'languages'; tag: string };

export interface ResumeReview {
  items: ReviewItem[];
  /** Ids accepted by default (new values, non-duplicate entries, new tags). */
  defaults: Set<string>;
  /** Fields where the résumé agrees with the profile — nothing to do. */
  unchanged: number;
}

function get(obj: object, path: string): string {
  const [section, field] = path.split('.') as [string, string];
  const value = (obj as Record<string, Record<string, unknown>>)[section]?.[field];
  return typeof value === 'string' ? value : '';
}

function comparable(path: ScalarPath, value: string): string {
  const v = value.trim().toLowerCase();
  if (path === 'personal.phone') return v.replace(/\D/g, '');
  if (path.startsWith('links.')) return v.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  return v.replace(/\s+/g, ' ');
}

const key = (...parts: string[]) =>
  parts
    .map((p) =>
      p
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
    )
    .join('|');

export function buildReview(profile: Profile, extracted: ExtractedResume): ResumeReview {
  const items: ReviewItem[] = [];
  const defaults = new Set<string>();
  let unchanged = 0;

  for (const { path, label, group } of SCALARS) {
    const value = get(extracted, path).trim();
    if (!value) continue;
    const existing = get(profile, path).trim();
    if (existing && comparable(path, existing) === comparable(path, value)) {
      unchanged++;
      continue;
    }
    const status = existing ? 'conflict' : 'new';
    items.push({ kind: 'scalar', id: path, group, label, existing, extracted: value, status });
    if (status === 'new') defaults.add(path);
  }

  const addEntries = <T>(
    group: EntryGroup,
    list: T[],
    existingKeys: Map<string, string>,
    describe: (e: T) => {
      title: string;
      subtitle: string;
      details: string;
      keys: string[];
      note?: string;
    },
  ) =>
    list.forEach((entry, i) => {
      const d = describe(entry);
      if (!d.title) return;
      const duplicateOf = d.keys.map((k) => existingKeys.get(k)).find(Boolean) ?? null;
      const id = `${group}:${i}`;
      items.push({
        kind: 'entry',
        id,
        group,
        title: d.title,
        subtitle: d.subtitle,
        details: d.details,
        duplicateOf,
        note: d.note ?? '',
      });
      if (!duplicateOf) defaults.add(id);
    });

  addEntries(
    'experience',
    extracted.experience,
    // Same role: same title + company, or same company + start date (titles get reworded).
    new Map(
      profile.experience.flatMap((e) => {
        const label = `${e.jobTitle} at ${e.company}`;
        return [
          [key(e.jobTitle, e.company), label],
          [key(e.company, e.startDate), label],
        ] as Array<[string, string]>;
      }),
    ),
    (e) => ({
      title: [e.jobTitle, e.company].filter(Boolean).join(' at '),
      subtitle: [formatDateRange(e.startDate, e.endDate, e.isCurrent), e.location]
        .filter(Boolean)
        .join(' · '),
      details: e.description,
      keys: [key(e.jobTitle, e.company), key(e.company, e.startDate)],
      note: e.monthAssumed
        ? 'Month not in résumé — January assumed. Adjust after saving if needed.'
        : '',
    }),
  );
  addEntries(
    'education',
    extracted.education,
    new Map(profile.education.map((e) => [key(e.institution), e.institution])),
    (e) => ({
      title: e.institution || e.degree,
      subtitle: [
        [e.degree, e.fieldOfStudy].filter(Boolean).join(', '),
        formatDateRange(e.startDate, e.endDate),
        e.gpa && `GPA ${e.gpa}`,
      ]
        .filter(Boolean)
        .join(' · '),
      details: e.description,
      keys: [key(e.institution || e.degree)],
    }),
  );
  addEntries(
    'projects',
    extracted.projects,
    new Map(profile.projects.map((p) => [key(p.name), p.name])),
    (p) => ({
      title: p.name,
      subtitle: p.technologies.join(', '),
      details: p.description,
      keys: [key(p.name)],
    }),
  );
  addEntries(
    'certifications',
    extracted.certifications,
    new Map(profile.certifications.map((c) => [key(c.name), c.name])),
    (c) => ({
      title: c.name,
      subtitle: [c.issuer, c.date].filter(Boolean).join(' · '),
      details: c.url,
      keys: [key(c.name)],
    }),
  );

  const addTags = (group: 'skills' | 'languages', tags: string[], existing: string[]) => {
    const have = new Set(existing.map((t) => t.toLowerCase()));
    for (const tag of tags) {
      if (have.has(tag.toLowerCase())) {
        unchanged++;
        continue;
      }
      const id = `${group}:${tag}`;
      items.push({ kind: 'tag', id, group, tag });
      defaults.add(id);
    }
  };
  addTags('skills', extracted.skills.technical, profile.skills.technical);
  addTags('languages', extracted.skills.languages, profile.skills.languages);

  return { items, defaults, unchanged };
}

/** Apply ONLY the accepted items. Unaccepted conflicts keep the existing value. */
export function applyReview(
  profile: Profile,
  extracted: ExtractedResume,
  review: ResumeReview,
  accepted: ReadonlySet<string>,
): Profile {
  const next: Profile = structuredClone(profile);
  for (const item of review.items) {
    if (!accepted.has(item.id)) continue;
    if (item.kind === 'scalar') {
      const [section, field] = item.id.split('.') as [
        'personal' | 'professional' | 'links',
        string,
      ];
      (next[section] as unknown as Record<string, string>)[field] = item.extracted;
    } else if (item.kind === 'tag') {
      if (item.group === 'skills') next.skills.technical.push(item.tag);
      else next.skills.languages.push(item.tag);
    } else {
      const index = Number(item.id.split(':')[1]);
      switch (item.group) {
        case 'experience': {
          const { monthAssumed, ...entry } = extracted.experience[index]!;
          // Start from an empty entry so fields the parser doesn't extract get defaults.
          next.experience.push({ ...createExperienceEntry(), ...entry, id: createId() });
          break;
        }
        case 'education':
          next.education.push({
            ...createEducationEntry(),
            ...extracted.education[index]!,
            id: createId(),
          });
          break;
        case 'projects':
          next.projects.push({
            ...createProjectEntry(),
            ...extracted.projects[index]!,
            id: createId(),
          });
          break;
        case 'certifications':
          next.certifications.push({ id: createId(), ...extracted.certifications[index]! });
          break;
      }
    }
  }
  return next;
}
