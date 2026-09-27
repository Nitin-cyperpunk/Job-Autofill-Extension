import type { FieldDescriptor, Profile } from '@jobfill/types';

/** Build a descriptor with sensible defaults — only the signals under test need setting. */
export function field(overrides: Partial<FieldDescriptor> = {}): FieldDescriptor {
  return {
    id: 'jf-test',
    type: 'text',
    widget: 'native',
    tagName: 'input',
    role: '',
    name: '',
    htmlId: '',
    placeholder: '',
    ariaLabel: '',
    autocomplete: '',
    dataHints: '',
    label: '',
    labelSource: 'label',
    nearbyText: '',
    description: '',
    section: '',
    options: [],
    required: false,
    multiple: false,
    visible: true,
    hasValue: false,
    ...overrides,
  };
}

export function options(...labels: string[]) {
  return labels.map((label) => ({ value: label, label, selected: false }));
}

/** A complete profile for planning tests. */
export function sampleProfile(): Profile {
  return {
    schemaVersion: 2,
    personal: {
      firstName: 'Ada',
      middleName: 'King',
      lastName: 'Lovelace',
      preferredName: '',
      email: 'ada@example.com',
      phone: '+44 20 7946 0000',
      country: 'United Kingdom',
      city: 'London',
      state: 'Greater London',
      address: '12 St James’s Square',
      postalCode: 'SW1Y 4JH',
    },
    professional: {
      currentTitle: 'Staff Engineer',
      summary: 'I build analytical engines.',
      yearsOfExperience: '7',
      currentCompany: 'Analytical Engines Ltd',
      noticePeriod: '30 days',
      expectedSalary: 'GBP 120,000',
      preferredLocations: ['Remote', 'London'],
      workAuthorization: 'Citizen',
      requiresSponsorship: false,
      willingToRelocate: true,
    },
    education: [
      {
        id: 'e1',
        degree: 'M.Sc.',
        fieldOfStudy: 'Mathematics',
        institution: 'University of London',
        location: 'London',
        startDate: '2014-09',
        endDate: '2016-06',
        gpa: '3.9/4.0',
        description: '',
      },
      {
        id: 'e2',
        degree: 'B.Sc.',
        fieldOfStudy: 'Computer Science',
        institution: 'Cambridge',
        location: 'Cambridge',
        startDate: '2010-09',
        endDate: '2013-06',
        gpa: '',
        description: '',
      },
    ],
    experience: [
      {
        id: 'x1',
        company: 'Analytical Engines Ltd',
        jobTitle: 'Staff Engineer',
        employmentType: 'full-time',
        location: 'London',
        startDate: '2020-03',
        endDate: '',
        isCurrent: true,
        description: 'Led the difference engine team.',
        skills: ['Rust'],
      },
      {
        id: 'x2',
        company: 'Babbage & Co',
        jobTitle: 'Engineer',
        employmentType: 'full-time',
        location: 'Cambridge',
        startDate: '2016-07',
        endDate: '2020-02',
        isCurrent: false,
        description: '',
        skills: [],
      },
    ],
    projects: [],
    certifications: [],
    skills: {
      technical: ['TypeScript', 'React', 'SQL'],
      soft: ['Leadership'],
      languages: ['English', 'French'],
    },
    links: {
      linkedin: 'https://linkedin.com/in/ada',
      github: 'https://github.com/ada',
      portfolio: 'https://ada.dev',
      website: 'https://ada.blog',
      other: [],
    },
    resume: {
      fileName: 'ada-resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      uploadedAt: '2026-01-01',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  };
}
