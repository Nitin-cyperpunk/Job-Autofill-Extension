/**
 * The candidate profile. This is the single source of truth for what JobFill
 * knows about the user, and it only ever lives in chrome.storage.local.
 *
 * Conventions:
 *  - Text fields are strings; "not provided" is the empty string, never undefined.
 *  - Dates are month precision, "YYYY-MM" (what <input type="month"> produces), or "".
 *  - Repeatable entries carry a stable `id` so UI lists can key and reorder them.
 */

export const PROFILE_SCHEMA_VERSION = 3;

/**
 * An explicit answer to a yes/no question. '' means the user hasn't answered — JobFill
 * then never guesses and leaves the question for review. (v2 stored some of these as
 * booleans defaulting to false, which made "never answered" look like "No".)
 */
export type Answer = '' | 'yes' | 'no';

/** A postal address. Every part is optional; '' means not provided. */
export interface Address {
  /** House / flat number and street. */
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  /** ZIP / PIN / postal code. */
  postalCode: string;
  country: string;
}

export interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  // Current address. Kept flat (v2 layout) so existing profiles keep working.
  /** Address line 1: house / flat number and street. */
  address: string;
  addressLine2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
  /** "Are your current and permanent addresses the same?" */
  permanentSameAsCurrent: Answer;
  /** Used when permanentSameAsCurrent is 'no' (or forms ask for both). */
  permanentAddress: Address;
  // Optional personal details: only ever filled from what the user entered here.
  /** "YYYY-MM-DD" or "". */
  dateOfBirth: string;
  gender: string;
  pronouns: string;
  nationality: string;
  citizenship: string;
  maritalStatus: string;
}

export interface ProfessionalInfo {
  currentTitle: string;
  summary: string;
  yearsOfExperience: string;
  currentCompany: string;
  noticePeriod: string;
  /** Current salary / CTC, as the user writes it ("12 LPA", "$95,000"). */
  currentSalary: string;
  expectedSalary: string;
  /** ISO currency code for salary fields, e.g. "INR", "USD". */
  salaryCurrency: string;
  /** "YYYY-MM-DD" or "". */
  earliestStartDate: string;
  preferredLocations: string[];
  preferredWorkMode: WorkMode | '';
  /** Job types the user is open to (full-time, internship…). */
  preferredJobTypes: EmploymentType[];
  /** Free-text status, e.g. "Citizen", "H-1B", "Permanent resident". */
  workAuthorization: string;
  /** Countries where the user is legally allowed to work, e.g. ["India"]. */
  authorizedCountries: string[];
  requiresSponsorship: Answer;
  willingToRelocate: Answer;
}

export interface EducationEntry {
  id: string;
  /** Education level: "Bachelor's", "Master's", "12th", "10th", "Diploma"… */
  level: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  /** Still studying here: the end date is the expected graduation. */
  isCurrent: boolean;
  /** Score as written: "8.6/10", "3.8", "86%". */
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

export const WORK_MODES = ['remote', 'hybrid', 'onsite', 'flexible'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

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
  /** Answer to "Why are you leaving / did you leave?" — only used if the user wrote one. */
  reasonForLeaving: string;
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
  /** The user's role, e.g. "Lead developer". */
  role: string;
  description: string;
  technologies: string[];
  /** Live / demo URL. */
  url: string;
  /** Repository URL. */
  githubUrl: string;
  /** "YYYY-MM" or "". */
  startDate: string;
  endDate: string;
  /** Result or achievement, e.g. "Used by 3 student societies". */
  outcome: string;
}

export interface OtherLink {
  id: string;
  label: string;
  url: string;
}

export interface LinksInfo {
  /** Shareable link to the resume (Google Drive, Dropbox, OneDrive…) for "link to your resume" fields. */
  resumeUrl: string;
  linkedin: string;
  github: string;
  portfolio: string;
  /** X / Twitter profile. */
  x: string;
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

/**
 * Answers the user configures explicitly. JobFill never infers any of these; empty
 * means the question is left for the user to answer on the form.
 */
export interface AdditionalInfo {
  /** Equal-opportunity (EEO) answers — exactly as the user wants them given. */
  disability: string;
  veteranStatus: string;
  ethnicity: string;
  /** Background / compliance answers. */
  backgroundCheck: Answer;
  drugTest: Answer;
  criminalRecord: Answer;
  /** "How did you hear about us?" */
  referralSource: string;
  /** Default cover letter text for cover-letter text boxes. */
  coverLetter: string;
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
  additional: AdditionalInfo;
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
  | 'links'
  | 'additional';

export type SectionValue<K extends SectionId> = Profile[K];
