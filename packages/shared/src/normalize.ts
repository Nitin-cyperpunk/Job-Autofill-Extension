import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  PROFILE_SCHEMA_VERSION,
  type Profile,
  type ResumeMeta,
  type StoredResume,
} from '@jobfill/types';
import { createEmptyProfile } from './default-profile';
import { createId } from './ids';
import { liftLegacyLinks } from './legacy-links';

/**
 * Lenient parsing for data we did not just validate ourselves: what is in storage
 * (possibly written by an older version) and imported files. Every field falls back
 * to its empty value instead of failing, unknown keys are stripped, and non-object
 * list entries are dropped. The result is always a well-formed Profile.
 *
 * This is about shape, not content — use validation.ts for user-facing rules.
 */

const text = z.string().catch('');
const flag = z.boolean().catch(false);
const nullableIso = z.string().nullable().catch(null);
const id = z
  .string()
  .min(1)
  .catch(() => createId());

/** Keep only string items, drop everything else. */
const stringList = z
  .array(z.unknown())
  .catch([])
  .transform((items) => items.filter((i): i is string => typeof i === 'string'));

/** Parse each item with `schema`, silently dropping items that are not objects. */
function entryList<T>(schema: z.ZodType<T>) {
  return z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items.flatMap((item) => {
        const result = schema.safeParse(item);
        return result.success ? [result.data] : [];
      }),
    );
}

const empty = createEmptyProfile();

const personalSchema = z
  .object({
    firstName: text,
    middleName: text,
    lastName: text,
    preferredName: text,
    email: text,
    phone: text,
    country: text,
    city: text,
    state: text,
    address: text,
    postalCode: text,
  })
  .catch(() => createEmptyProfile().personal);

const professionalSchema = z
  .object({
    currentTitle: text,
    summary: text,
    yearsOfExperience: text,
    currentCompany: text,
    noticePeriod: text,
    expectedSalary: text,
    preferredLocations: stringList,
    workAuthorization: text,
    requiresSponsorship: flag,
    willingToRelocate: flag,
  })
  .catch(() => createEmptyProfile().professional);

const educationSchema = z.object({
  id,
  degree: text,
  fieldOfStudy: text,
  institution: text,
  location: text,
  startDate: text,
  endDate: text,
  gpa: text,
  description: text,
});

const experienceSchema = z.object({
  id,
  company: text,
  jobTitle: text,
  employmentType: z.enum([...EMPLOYMENT_TYPES, '']).catch(''),
  location: text,
  startDate: text,
  endDate: text,
  isCurrent: flag,
  description: text,
  skills: stringList,
});

const projectSchema = z.object({
  id,
  name: text,
  description: text,
  technologies: stringList,
  url: text,
  githubUrl: text,
});

const certificationSchema = z.object({ id, name: text, issuer: text, date: text, url: text });

const skillsSchema = z
  .object({ technical: stringList, soft: stringList, languages: stringList })
  .catch(() => createEmptyProfile().skills);

const linksSchema = z
  .object({
    resumeUrl: text,
    linkedin: text,
    github: text,
    portfolio: text,
    x: text,
    website: text,
    other: entryList(z.object({ id, label: text, url: text })),
  })
  .catch(() => createEmptyProfile().links);

const resumeMetaShape = {
  fileName: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.string(),
};

const resumeMetaSchema = z.object(resumeMetaShape);

const profileSchema = z
  .object({
    schemaVersion: z.literal(PROFILE_SCHEMA_VERSION).catch(PROFILE_SCHEMA_VERSION),
    personal: personalSchema,
    professional: professionalSchema,
    education: entryList(educationSchema),
    experience: entryList(experienceSchema),
    projects: entryList(projectSchema),
    certifications: entryList(certificationSchema),
    skills: skillsSchema,
    links: linksSchema,
    resume: resumeMetaSchema.nullable().catch(null),
    createdAt: nullableIso,
    updatedAt: nullableIso,
    onboardingCompletedAt: nullableIso,
  })
  .catch(() => createEmptyProfile());

export function normalizeProfile(raw: unknown): Profile {
  return profileSchema.parse(liftLegacyLinks(raw ?? empty));
}

export function normalizeResumeMeta(raw: unknown): ResumeMeta | null {
  const result = resumeMetaSchema.safeParse(raw);
  return result.success ? result.data : null;
}

const storedResumeSchema = z.object({
  ...resumeMetaShape,
  dataBase64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/),
});

export function parseStoredResume(raw: unknown): StoredResume | null {
  const result = storedResumeSchema.safeParse(raw);
  return result.success ? result.data : null;
}
