import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  PROFILE_SCHEMA_VERSION,
  WORK_MODES,
  type Profile,
  type ResumeMeta,
  type StoredResume,
} from '@jobfill/types';
import { createEmptyAdditional, createEmptyAddress, createEmptyProfile } from './default-profile';
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
/**
 * Yes/no answers. v2 stored relocation/sponsorship as booleans defaulting to false, so
 * `true` was a real answer but `false` may only mean "never answered": it migrates to ''
 * (not answered) rather than a "No" the user may never have given.
 */
const answer = z
  .union([z.enum(['', 'yes', 'no']), z.boolean()])
  .transform((v): '' | 'yes' | 'no' => (v === true ? 'yes' : v === false ? '' : v))
  .catch('');
/** "YYYY-MM-DD" only; anything else becomes "". */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .catch('');
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

const addressSchema = z
  .object({
    line1: text,
    line2: text,
    landmark: text,
    city: text,
    district: text,
    state: text,
    postalCode: text,
    country: text,
  })
  .catch(() => createEmptyAddress());

const personalSchema = z
  .object({
    firstName: text,
    middleName: text,
    lastName: text,
    preferredName: text,
    email: text,
    phone: text,
    alternatePhone: text,
    address: text,
    addressLine2: text,
    landmark: text,
    city: text,
    district: text,
    state: text,
    postalCode: text,
    country: text,
    permanentSameAsCurrent: answer,
    permanentAddress: addressSchema,
    dateOfBirth: isoDate,
    gender: text,
    pronouns: text,
    nationality: text,
    citizenship: text,
    maritalStatus: text,
  })
  .catch(() => createEmptyProfile().personal);

const professionalSchema = z
  .object({
    currentTitle: text,
    summary: text,
    yearsOfExperience: text,
    currentCompany: text,
    noticePeriod: text,
    currentSalary: text,
    expectedSalary: text,
    salaryCurrency: text,
    earliestStartDate: isoDate,
    preferredLocations: stringList,
    preferredWorkMode: z.enum([...WORK_MODES, '']).catch(''),
    preferredJobTypes: z
      .array(z.unknown())
      .catch([])
      .transform((items) =>
        items.filter((i): i is (typeof EMPLOYMENT_TYPES)[number] =>
          (EMPLOYMENT_TYPES as readonly unknown[]).includes(i),
        ),
      ),
    workAuthorization: text,
    authorizedCountries: stringList,
    requiresSponsorship: answer,
    willingToRelocate: answer,
  })
  .catch(() => createEmptyProfile().professional);

const educationSchema = z.object({
  id,
  level: text,
  degree: text,
  fieldOfStudy: text,
  institution: text,
  location: text,
  startDate: text,
  endDate: text,
  isCurrent: flag,
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
  reasonForLeaving: text,
});

const projectSchema = z.object({
  id,
  name: text,
  role: text,
  description: text,
  technologies: stringList,
  url: text,
  githubUrl: text,
  startDate: text,
  endDate: text,
  outcome: text,
});

const additionalSchema = z
  .object({
    disability: text,
    veteranStatus: text,
    ethnicity: text,
    backgroundCheck: answer,
    drugTest: answer,
    criminalRecord: answer,
    referralSource: text,
    coverLetter: text,
  })
  .catch(() => createEmptyAdditional());

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
    additional: additionalSchema,
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
