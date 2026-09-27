import {
  PROFILE_SCHEMA_VERSION,
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
      country: '',
      city: '',
      state: '',
      address: '',
      postalCode: '',
    },
    professional: {
      currentTitle: '',
      summary: '',
      yearsOfExperience: '',
      currentCompany: '',
      noticePeriod: '',
      expectedSalary: '',
      preferredLocations: [],
      workAuthorization: '',
      requiresSponsorship: false,
      willingToRelocate: false,
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
    resume: null,
    createdAt: null,
    updatedAt: null,
    onboardingCompletedAt: null,
  };
}

export function createEducationEntry(): EducationEntry {
  return {
    id: createId(),
    degree: '',
    fieldOfStudy: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
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
  };
}

export function createProjectEntry(): ProjectEntry {
  return { id: createId(), name: '', description: '', technologies: [], url: '', githubUrl: '' };
}

export function createCertificationEntry(): CertificationEntry {
  return { id: createId(), name: '', issuer: '', date: '', url: '' };
}

export function createOtherLink(): OtherLink {
  return { id: createId(), label: '', url: '' };
}
