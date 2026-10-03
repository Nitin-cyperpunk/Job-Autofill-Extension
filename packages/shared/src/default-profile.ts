import {
  PROFILE_SCHEMA_VERSION,
  type AdditionalInfo,
  type Address,
  type CertificationEntry,
  type EducationEntry,
  type ExperienceEntry,
  type OtherLink,
  type Profile,
  type ProjectEntry,
} from '@jobfill/types';
import { createId } from './ids';

export function createEmptyProfile(): Profile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    personal: {
      firstName: '',
      middleName: '',
      lastName: '',
      preferredName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      addressLine2: '',
      landmark: '',
      city: '',
      district: '',
      state: '',
      postalCode: '',
      country: '',
      permanentSameAsCurrent: '',
      permanentAddress: createEmptyAddress(),
      dateOfBirth: '',
      gender: '',
      pronouns: '',
      nationality: '',
      citizenship: '',
      maritalStatus: '',
    },
    professional: {
      currentTitle: '',
      summary: '',
      yearsOfExperience: '',
      currentCompany: '',
      noticePeriod: '',
      currentSalary: '',
      expectedSalary: '',
      salaryCurrency: '',
      earliestStartDate: '',
      preferredLocations: [],
      preferredWorkMode: '',
      preferredJobTypes: [],
      workAuthorization: '',
      authorizedCountries: [],
      requiresSponsorship: '',
      willingToRelocate: '',
    },
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: { technical: [], soft: [], languages: [] },
    links: {
      resumeUrl: '',
      linkedin: '',
      github: '',
      portfolio: '',
      x: '',
      website: '',
      other: [],
    },
    additional: createEmptyAdditional(),
    sources: { resume: [] },
    resume: null,
    createdAt: null,
    updatedAt: null,
    onboardingCompletedAt: null,
  };
}

export function createEmptyAddress(): Address {
  return {
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    postalCode: '',
    country: '',
  };
}

export function createEmptyAdditional(): AdditionalInfo {
  return {
    disability: '',
    veteranStatus: '',
    ethnicity: '',
    backgroundCheck: '',
    drugTest: '',
    criminalRecord: '',
    referralSource: '',
    coverLetter: '',
  };
}

export function createEducationEntry(): EducationEntry {
  return {
    id: createId(),
    level: '',
    degree: '',
    fieldOfStudy: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    gpa: '',
    description: '',
  };
}

export function createExperienceEntry(): ExperienceEntry {
  return {
    id: createId(),
    company: '',
    jobTitle: '',
    employmentType: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    skills: [],
    reasonForLeaving: '',
  };
}

export function createProjectEntry(): ProjectEntry {
  return {
    id: createId(),
    name: '',
    role: '',
    description: '',
    technologies: [],
    url: '',
    githubUrl: '',
    startDate: '',
    endDate: '',
    outcome: '',
  };
}

export function createCertificationEntry(): CertificationEntry {
  return { id: createId(), name: '', issuer: '', date: '', url: '' };
}

export function createOtherLink(): OtherLink {
  return { id: createId(), label: '', url: '' };
}
