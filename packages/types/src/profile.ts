/**
 * The candidate profile. This is the single source of truth for what JobFill
 * knows about the user, and it only ever lives in chrome.storage.local.
 *
 * Conventions:
 *  - Text fields are strings; "not provided" is the empty string, never undefined.
 *  - Dates are month precision, "YYYY-MM" (what <input type="month"> produces), or "".
 *  - Repeatable entries carry a stable `id` so UI lists can key and reorder them.
 */

export const PROFILE_SCHEMA_VERSION = 2;

export interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  address: string;
  postalCode: string;
}

export interface ProfessionalInfo {
  currentTitle: string;
  summary: string;
  yearsOfExperience: string;
  currentCompany: string;
  noticePeriod: string;
  expectedSalary: string;
  preferredLocations: string[];
  workAuthorization: string;
  requiresSponsorship: boolean;
  willingToRelocate: boolean;
}

export interface EducationEntry {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
  'temporary',
  'apprenticeship',
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface ExperienceEntry {
  id: string;
  company: string;
  jobTitle: string;
  employmentType: EmploymentType | '';
  location: string;
  startDate: string;
  endDate: string;
  /** When true, endDate is ignored and the role is shown as "Present". */
  isCurrent: boolean;
  description: string;
  skills: string[];
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  /** "YYYY-MM" or "". */
  date: string;
  url: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  githubUrl: string;
}

export interface OtherLink {
  id: string;
  label: string;
  url: string;
}

export interface LinksInfo {
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  other: OtherLink[];
}

/** Metadata only; the file bytes live under a separate storage key (see StoredResume). */
export interface ResumeMeta {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Profile {
  schemaVersion: typeof PROFILE_SCHEMA_VERSION;
  personal: PersonalInfo;
  professional: ProfessionalInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  skills: Skills;
  links: LinksInfo;
  resume: ResumeMeta | null;
  /** ISO timestamps. Null until the first save / until onboarding is finished. */
  createdAt: string | null;
  updatedAt: string | null;
  onboardingCompletedAt: string | null;
}

/** The editable sections of a profile (resume is managed separately as a file). */
export type SectionId =
  | 'personal'
  | 'professional'
  | 'education'
  | 'experience'
  | 'projects'
  | 'certifications'
  | 'skills'
  | 'links';

export type SectionValue<K extends SectionId> = Profile[K];
