import { z } from 'zod';
import type { SectionId, SectionValue } from '@jobfill/types';
import { isHttpUrl, normalizeUrl } from './url';

/**
 * User-facing validation for the profile editor.
 * Errors are keyed by dot path relative to the section, e.g. "email" or "0.endDate".
 */
export type FieldErrors = Record<string, string>;

const SHORT = 200;
const LONG = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const short = z.string().max(SHORT, `Keep this under ${SHORT} characters.`);
const long = z.string().max(LONG, `Keep this under ${LONG} characters.`);
const required = (label: string) => short.min(1, `${label} is required.`);
const optionalMatch = (re: RegExp, message: string) =>
  short.refine((v) => v === '' || re.test(v), message);
const optionalUrl = z
  .string()
  .max(2000, 'This link is too long.')
  .refine((v) => v === '' || isHttpUrl(v), 'Enter a valid web address, e.g. https://example.com');
const month = z.string().refine((v) => v === '' || MONTH_RE.test(v), 'Use the format YYYY-MM.');
const tags = z
  .array(z.string().max(60, 'Each item must be under 60 characters.'))
  .max(100, 'That is a lot of items — keep it under 100.');

function endAfterStart(entry: { startDate: string; endDate: string }, ctx: z.RefinementCtx) {
  if (entry.startDate && entry.endDate && entry.endDate < entry.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'End date can’t be before the start date.',
    });
  }
}

const schemas = {
  personal: z.object({
    firstName: required('First name'),
    middleName: short,
    lastName: required('Last name'),
    preferredName: short,
    email: required('Email').refine((v) => v === '' || EMAIL_RE.test(v), 'Enter a valid email.'),
    phone: optionalMatch(PHONE_RE, 'Enter a valid phone number, e.g. +1 555 010 0000.'),
    country: short,
    city: short,
    state: short,
    address: short,
    postalCode: optionalMatch(/^[A-Za-z0-9 -]{3,10}$/, 'Enter a valid ZIP/PIN code.'),
  }),
  professional: z.object({
    currentTitle: short,
    summary: long,
    yearsOfExperience: optionalMatch(/^\d{1,2}(\.\d)?$/, 'Enter a number, e.g. 4 or 2.5.'),
    currentCompany: short,
    noticePeriod: short,
    expectedSalary: short,
    preferredLocations: tags,
    workAuthorization: short,
    requiresSponsorship: z.boolean(),
    willingToRelocate: z.boolean(),
  }),
  education: z.array(
    z
      .object({
        id: z.string(),
        degree: short,
        fieldOfStudy: short,
        institution: required('Institution'),
        location: short,
        startDate: month,
        endDate: month,
        gpa: z.string().max(20, 'Keep GPA/CGPA short, e.g. 3.8/4.0.'),
        description: long,
      })
      .superRefine(endAfterStart),
  ),
  experience: z.array(
    z
      .object({
        id: z.string(),
        company: required('Company'),
        jobTitle: required('Job title'),
        employmentType: z.string(),
        location: short,
        startDate: month,
        endDate: month,
        isCurrent: z.boolean(),
        description: long,
        skills: tags,
      })
      .superRefine(endAfterStart),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: required('Project name'),
      description: long,
      technologies: tags,
      url: optionalUrl,
      githubUrl: optionalUrl,
    }),
  ),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: required('Certification name'),
      issuer: short,
      date: month,
      url: optionalUrl,
    }),
  ),
  skills: z.object({ technical: tags, soft: tags, languages: tags }),
  links: z.object({
    resumeUrl: optionalUrl,
    linkedin: optionalUrl,
    github: optionalUrl,
    portfolio: optionalUrl,
    x: optionalUrl,
    website: optionalUrl,
    other: z.array(
      z.object({
        id: z.string(),
        label: short,
        url: optionalUrl.refine((v) => v !== '', 'Enter the link address.'),
      }),
    ),
  }),
} satisfies Record<SectionId, z.ZodType>;

export function validateSection<K extends SectionId>(id: K, value: SectionValue<K>): FieldErrors {
  const result = schemas[id].safeParse(value);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] ??= issue.message; // first message per field wins
  }
  return errors;
}

/**
 * Validation while the user is still typing: like validateSection, but list entries
 * that are still completely blank are not flagged (they are dropped on save anyway).
 */
export function validateDraft<K extends SectionId>(id: K, value: SectionValue<K>): FieldErrors {
  const errors = validateSection(id, value);
  if (!Array.isArray(value)) return errors;
  const blank = new Set(
    (value as object[]).flatMap((entry, i) =>
      isBlank({ ...entry, employmentType: '' }) ? [String(i)] : [],
    ),
  );
  return Object.fromEntries(
    Object.entries(errors).filter(([path]) => !blank.has(path.split('.')[0]!)),
  );
}

/** Errors for one list item: scopeErrors({"1.url": "…"}, "1") → {"url": "…"}. */
export function scopeErrors(errors: FieldErrors, prefix: string): FieldErrors {
  const scoped: FieldErrors = {};
  const start = `${prefix}.`;
  for (const [path, message] of Object.entries(errors)) {
    if (path.startsWith(start)) scoped[path.slice(start.length)] = message;
  }
  return scoped;
}

// ---------------------------------------------------------------------------
// Cleaning: run before validation on save. Trims text, normalises URLs,
// de-duplicates tags and drops list entries the user left completely blank.
// ---------------------------------------------------------------------------

export function cleanTags(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, ' ');
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

function trimStrings<T extends object>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === 'string') out[key] = value.trim();
    else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      out[key] = cleanTags(value as string[]);
    }
  }
  return out as T;
}

/** True when every user-entered text/list field is empty (ids and flags ignored). */
function isBlank(obj: object): boolean {
  return Object.entries(obj).every(([key, value]) => {
    if (key === 'id' || typeof value === 'boolean') return true;
    if (Array.isArray(value)) return value.length === 0;
    return value === '';
  });
}

const cleaners: { [K in SectionId]: (value: SectionValue<K>) => SectionValue<K> } = {
  personal: (v) => ({ ...trimStrings(v), email: v.email.trim().toLowerCase() }),
  professional: (v) => trimStrings(v),
  education: (list) => list.map(trimStrings).filter((e) => !isBlank(e)),
  experience: (list) =>
    list
      .map(trimStrings)
      .map((e) => (e.isCurrent ? { ...e, endDate: '' } : e))
      .filter((e) => !isBlank({ ...e, employmentType: '' })),
  projects: (list) =>
    list
      .map(trimStrings)
      .map((p) => ({ ...p, url: normalizeUrl(p.url), githubUrl: normalizeUrl(p.githubUrl) }))
      .filter((p) => !isBlank(p)),
  certifications: (list) =>
    list
      .map(trimStrings)
      .map((c) => ({ ...c, url: normalizeUrl(c.url) }))
      .filter((c) => !isBlank(c)),
  skills: (v) => trimStrings(v),
  links: (v) => ({
    resumeUrl: normalizeUrl(v.resumeUrl),
    linkedin: normalizeUrl(v.linkedin),
    github: normalizeUrl(v.github),
    portfolio: normalizeUrl(v.portfolio),
    x: normalizeUrl(v.x),
    website: normalizeUrl(v.website),
    other: v.other
      .map((l) => ({ ...l, label: l.label.trim(), url: normalizeUrl(l.url) }))
      .filter((l) => l.label || l.url),
  }),
};

export function cleanSection<K extends SectionId>(id: K, value: SectionValue<K>): SectionValue<K> {
  return cleaners[id](value);
}

/** Clean, then validate. What every "Save" button runs. */
export function prepareSection<K extends SectionId>(
  id: K,
  value: SectionValue<K>,
): { value: SectionValue<K>; errors: FieldErrors; valid: boolean } {
  const cleaned = cleanSection(id, value);
  const errors = validateSection(id, cleaned);
  return { value: cleaned, errors, valid: Object.keys(errors).length === 0 };
}
