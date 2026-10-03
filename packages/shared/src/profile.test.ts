import { describe, expect, it } from 'vitest';
import {
  buildExportFile,
  computeCompleteness,
  createEducationEntry,
  createEmptyProfile,
  createExperienceEntry,
  createProjectEntry,
  migrateProfileV1,
  normalizeProfile,
  parseImportFile,
  prepareSection,
  pruneSources,
  scopeErrors,
  validateDraft,
} from './index';
import type { Profile, StoredResume } from '@jobfill/types';

function filledProfile(): Profile {
  const p = createEmptyProfile();
  p.personal = {
    ...p.personal,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+44 20 7946 0000',
    address: '12 St James’s Square',
    city: 'London',
    postalCode: 'SW1Y 4JH',
    permanentSameAsCurrent: 'yes',
  };
  p.professional = {
    ...p.professional,
    currentTitle: 'Engineer',
    summary: 'Hi',
    yearsOfExperience: '5',
    workAuthorization: 'Citizen',
    requiresSponsorship: 'no',
    noticePeriod: '30 days',
    expectedSalary: 'GBP 120,000',
  };
  p.education = [{ ...createEducationEntry(), institution: 'Cambridge' }];
  p.experience = [
    { ...createExperienceEntry(), company: 'Analytical Engines', jobTitle: 'Engineer' },
  ];
  p.projects = [
    {
      ...createProjectEntry(),
      id: 'p1',
      name: 'Notes',
      description: 'A notes app.',
      technologies: ['TypeScript'],
    },
  ];
  p.skills.technical = ['Math', 'Poetry', 'Punch cards'];
  p.links.linkedin = 'https://linkedin.com/in/ada';
  p.resume = {
    fileName: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 10,
    uploadedAt: '2026-01-01',
  };
  return p;
}

describe('normalizeProfile', () => {
  it('turns garbage into an empty, well-formed profile', () => {
    expect(normalizeProfile('nope')).toEqual(createEmptyProfile());
    expect(normalizeProfile(null)).toEqual(createEmptyProfile());
  });

  it('keeps valid data, fixes wrong types and strips unknown keys', () => {
    const p = normalizeProfile({
      personal: { firstName: 'Ada', lastName: 42, hacker: '<script>' },
      experience: [
        { company: 'A', employmentType: 'wizard', skills: ['x', 1, 'y'] },
        'not an entry',
      ],
    });
    expect(p.personal.firstName).toBe('Ada');
    expect(p.personal.lastName).toBe('');
    expect(p.personal).not.toHaveProperty('hacker');
    expect(p.experience).toHaveLength(1);
    expect(p.experience[0]?.employmentType).toBe('');
    expect(p.experience[0]?.skills).toEqual(['x', 'y']);
    expect(p.experience[0]?.id).toBeTruthy();
  });
});

describe('migrateProfileV1', () => {
  it('maps the flat phase-1 profile into sections', () => {
    const p = migrateProfileV1({
      personal: { firstName: 'Ada', email: 'ada@example.com' },
      work: { currentTitle: 'Engineer', desiredSalary: '100k', willingToRelocate: true },
      summary: 'Summary',
      links: { github: 'https://github.com/ada' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(p.personal.firstName).toBe('Ada');
    expect(p.professional).toMatchObject({
      currentTitle: 'Engineer',
      expectedSalary: '100k',
      summary: 'Summary',
      // v1 booleans: true was a real answer and migrates to 'yes'.
      willingToRelocate: 'yes',
    });
    expect(p.links.github).toBe('https://github.com/ada');
    expect(p.onboardingCompletedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('optional personal details: gender, DOB, address', () => {
  const base = () => filledProfile().personal;

  it('saves gender, date of birth and a structured address', () => {
    const { value, valid } = prepareSection('personal', {
      ...base(),
      gender: 'Non-binary',
      dateOfBirth: '1999-04-21',
      address: ' Flat 302, MG Road ',
      addressLine2: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      permanentSameAsCurrent: 'no',
      permanentAddress: {
        ...base().permanentAddress,
        line1: '12 Station Rd',
        city: 'Jaipur',
        postalCode: '302001',
      },
    });
    expect(valid).toBe(true);
    expect(value.gender).toBe('Non-binary');
    expect(value.dateOfBirth).toBe('1999-04-21');
    expect(value.address).toBe('Flat 302, MG Road');
    expect(value.postalCode).toBe('560038');
    expect(value.permanentAddress.city).toBe('Jaipur');
  });

  it('saves with gender, DOB and address all skipped', () => {
    const { valid, errors } = prepareSection('personal', {
      ...base(),
      gender: '',
      dateOfBirth: '',
      address: '',
      city: '',
      postalCode: '',
      permanentSameAsCurrent: '',
    });
    expect(errors).toEqual({});
    expect(valid).toBe(true);
  });

  it('loads an older profile without these fields', () => {
    const old = JSON.parse(JSON.stringify(filledProfile())) as Record<string, unknown>;
    const personal = old.personal as Record<string, unknown>;
    delete personal.gender;
    delete personal.dateOfBirth;
    delete personal.permanentAddress;
    delete old.sources;
    const loaded = normalizeProfile(old);
    expect(loaded.personal.firstName).toBe('Ada');
    expect(loaded.personal.gender).toBe('');
    expect(loaded.personal.dateOfBirth).toBe('');
    expect(loaded.personal.permanentAddress.line1).toBe('');
    expect(loaded.sources.resume).toEqual([]);
  });

  it('forgets "from resume" for a value the user changed, keeps the rest', () => {
    const p = filledProfile();
    p.sources = { resume: ['personal.email', 'personal.city', 'experience', 'skills.technical'] };
    const next = pruneSources(p, 'personal', { ...p.personal, city: 'Cambridge' });
    expect(next.resume).toEqual(['personal.email', 'experience', 'skills.technical']);
    expect(pruneSources(p, 'experience', []).resume).not.toContain('experience');
  });
});

describe('prepareSection', () => {
  it('requires name and a valid email', () => {
    const { errors, valid } = prepareSection('personal', {
      ...createEmptyProfile().personal,
      email: 'nope',
    });
    expect(valid).toBe(false);
    expect(errors).toMatchObject({
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      email: 'Enter a valid email.',
    });
  });

  it('trims and lowercases email', () => {
    const personal = {
      ...createEmptyProfile().personal,
      firstName: ' Ada ',
      lastName: 'L',
      email: ' Ada@Example.COM ',
    };
    const { value, valid } = prepareSection('personal', personal);
    expect(valid).toBe(true);
    expect(value.firstName).toBe('Ada');
    expect(value.email).toBe('ada@example.com');
  });

  it('drops blank entries and flags end-before-start', () => {
    const blank = createEducationEntry();
    const bad = {
      ...createEducationEntry(),
      institution: 'MIT',
      startDate: '2024-05',
      endDate: '2023-01',
    };
    const { value, errors } = prepareSection('education', [blank, bad]);
    expect(value).toHaveLength(1);
    expect(scopeErrors(errors, '0')).toEqual({
      endDate: 'End date can’t be before the start date.',
    });
  });

  it('clears end date for current roles', () => {
    const role = {
      ...createExperienceEntry(),
      company: 'A',
      jobTitle: 'B',
      isCurrent: true,
      endDate: '2020-01',
    };
    expect(prepareSection('experience', [role]).value[0]?.endDate).toBe('');
  });

  it('normalises bare domains and rejects non-http links', () => {
    const links = {
      ...createEmptyProfile().links,
      linkedin: 'linkedin.com/in/ada',
      github: 'javascript:alert(1)',
    };
    const { value, errors } = prepareSection('links', links);
    expect(value.linkedin).toBe('https://linkedin.com/in/ada');
    expect(errors.linkedin).toBeUndefined();
    expect(errors.github).toMatch(/valid web address/);
  });

  it('de-duplicates tags case-insensitively', () => {
    const skills = { technical: ['React', ' react ', 'TypeScript', ''], soft: [], languages: [] };
    expect(prepareSection('skills', skills).value.technical).toEqual(['React', 'TypeScript']);
  });
});

describe('validateDraft', () => {
  it('does not flag list entries the user has not started yet', () => {
    const started = { ...createEducationEntry(), degree: 'BSc' };
    const errors = validateDraft('education', [started, createEducationEntry()]);
    expect(Object.keys(errors)).toEqual(['0.institution']);
  });
});

describe('v2 → v3 migration', () => {
  it('keeps every stored value and adds the new fields empty', () => {
    // Exactly what a v2 build wrote to chrome.storage.local.
    const v2 = {
      schemaVersion: 2,
      personal: {
        firstName: 'Ada',
        middleName: '',
        lastName: 'Lovelace',
        preferredName: '',
        email: 'ada@example.com',
        phone: '+44 20 7946 0000',
        country: 'United Kingdom',
        city: 'London',
        state: '',
        address: '12 St James’s Square',
        postalCode: 'SW1Y 4JH',
      },
      professional: {
        currentTitle: 'Engineer',
        summary: '',
        yearsOfExperience: '7',
        currentCompany: '',
        noticePeriod: '30 days',
        expectedSalary: '',
        preferredLocations: ['London'],
        workAuthorization: 'Citizen',
        requiresSponsorship: false,
        willingToRelocate: true,
      },
      education: [
        {
          id: 'e1',
          degree: 'M.Sc.',
          fieldOfStudy: '',
          institution: 'UCL',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
          description: '',
        },
      ],
      experience: [],
      projects: [
        { id: 'p1', name: 'Notes', description: 'x', technologies: ['TS'], url: '', githubUrl: '' },
      ],
      certifications: [],
      skills: { technical: ['TS'], soft: [], languages: [] },
      links: {
        resumeUrl: '',
        linkedin: 'https://linkedin.com/in/ada',
        github: '',
        portfolio: '',
        x: '',
        website: '',
        other: [],
      },
      resume: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
    };
    const p = normalizeProfile(v2);
    expect(p.schemaVersion).toBe(3);
    expect(p.personal).toMatchObject({
      firstName: 'Ada',
      postalCode: 'SW1Y 4JH',
      gender: '',
      dateOfBirth: '',
      permanentSameAsCurrent: '',
    });
    expect(p.personal.permanentAddress.city).toBe('');
    // true was a real answer; false may only mean "never answered" — never turned into "No".
    expect(p.professional).toMatchObject({
      willingToRelocate: 'yes',
      requiresSponsorship: '',
      authorizedCountries: [],
      workAuthorization: 'Citizen',
    });
    expect(p.education[0]).toMatchObject({ institution: 'UCL', level: '', isCurrent: false });
    expect(p.projects[0]).toMatchObject({ name: 'Notes', role: '', outcome: '', startDate: '' });
    expect(p.additional).toEqual(createEmptyProfile().additional);
    expect(p.links.linkedin).toBe('https://linkedin.com/in/ada');
    expect(p.onboardingCompletedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('computeCompleteness', () => {
  it('is 0 for an empty profile and 100 for a full one', () => {
    expect(computeCompleteness(createEmptyProfile()).percent).toBe(0);
    expect(computeCompleteness(filledProfile()).percent).toBe(100);
  });

  it('gives partial credit with hints', () => {
    const p = createEmptyProfile();
    p.personal.email = 'a@b.co';
    const result = computeCompleteness(p);
    expect(result.percent).toBe(10); // 30 * 1/3
    expect(result.items.find((i) => i.id === 'personal')?.missing).toContain('Phone');
  });

  it('treats address, DOB, gender and preferences as optional — never blocking', () => {
    const p = filledProfile();
    p.personal = {
      ...p.personal,
      address: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      dateOfBirth: '',
      gender: '',
      permanentSameAsCurrent: '',
    };
    p.professional = {
      ...p.professional,
      noticePeriod: '',
      earliestStartDate: '',
      workAuthorization: '',
      authorizedCountries: [],
      requiresSponsorship: '',
      expectedSalary: '',
      currentSalary: '',
    };
    const result = computeCompleteness(p);
    expect(result.percent).toBe(100);
    expect(result.coreComplete).toBe(true);
    const missing = result.optional.filter((o) => !o.provided).map((o) => o.label);
    expect(missing).toEqual(
      expect.arrayContaining([
        'Current address',
        'Date of birth',
        'Gender',
        'Availability',
        'Work authorization',
      ]),
    );
  });
});

describe('export / import', () => {
  const resume: StoredResume = {
    fileName: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 3,
    uploadedAt: '2026-01-01',
    dataBase64: 'YWJj',
  };

  it('round-trips a profile with its resume', () => {
    const file = buildExportFile(filledProfile(), resume);
    const result = parseImportFile(JSON.stringify(file));
    if (!result.ok) throw new Error(result.error);
    expect(result.profile.personal.firstName).toBe('Ada');
    expect(result.resume?.dataBase64).toBe('YWJj');
    expect(result.profile.resume).toEqual({
      fileName: 'cv.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 3,
      uploadedAt: '2026-01-01',
    });
  });

  it('drops resume metadata when the file has no resume', () => {
    const result = parseImportFile(JSON.stringify(buildExportFile(filledProfile(), null)));
    expect(result.ok && result.profile.resume).toBe(null);
  });

  it('rejects files that are not JobFill exports', () => {
    expect(parseImportFile('{oops')).toMatchObject({ ok: false });
    expect(parseImportFile('{"format":"other"}')).toMatchObject({ ok: false });
    expect(
      parseImportFile(JSON.stringify({ format: 'jobfill.profile', version: 99, profile: {} })),
    ).toMatchObject({
      ok: false,
      error: expect.stringMatching(/newer version/),
    });
  });

  it('skips a corrupt resume with a warning', () => {
    const file = {
      ...buildExportFile(filledProfile(), resume),
      resume: { ...resume, dataBase64: '!!not base64!!' },
    };
    const result = parseImportFile(JSON.stringify(file));
    expect(result.ok && result.resume).toBe(null);
    expect(result.ok && result.warnings).toHaveLength(1);
  });
});

describe('legacy link fields', () => {
  it('lifts linkedinUrl / linkedinProfile / linkedinProfileUrl into links.linkedin', () => {
    for (const key of ['linkedinUrl', 'linkedinProfile', 'linkedinProfileUrl']) {
      const p = normalizeProfile({ links: { [key]: 'https://linkedin.com/in/ada' } });
      expect(p.links.linkedin, key).toBe('https://linkedin.com/in/ada');
    }
    // Also from personal.* and the top level, where some older builds kept it.
    expect(
      normalizeProfile({ personal: { linkedinUrl: 'linkedin.com/in/ada' } }).links.linkedin,
    ).toBe('linkedin.com/in/ada');
    expect(normalizeProfile({ twitter: 'https://x.com/ada' }).links.x).toBe('https://x.com/ada');
    expect(
      normalizeProfile({ resume: { resumeDriveUrl: 'https://drive.google.com/x' } }).links
        .resumeUrl,
    ).toBe('https://drive.google.com/x');
  });

  it('never overwrites the canonical value and is idempotent', () => {
    const raw = {
      links: {
        linkedin: 'https://linkedin.com/in/current',
        linkedinUrl: 'https://linkedin.com/in/old',
        other: [
          { id: 'a', label: 'GitHub', url: 'https://github.com/ada' },
          { id: 'b', label: 'Blog', url: 'https://ada.blog' },
        ],
      },
    };
    const once = normalizeProfile(raw);
    expect(once.links.linkedin).toBe('https://linkedin.com/in/current');
    expect(once.links.github).toBe('https://github.com/ada');
    expect(once.links.other).toEqual([{ id: 'b', label: 'Blog', url: 'https://ada.blog' }]);
    expect(normalizeProfile(once)).toEqual(once);
  });

  it('keeps existing profiles intact (new keys default to empty)', () => {
    const p = normalizeProfile({
      links: { linkedin: 'https://linkedin.com/in/ada', github: '', portfolio: '', website: '' },
    });
    expect(p.links).toMatchObject({
      linkedin: 'https://linkedin.com/in/ada',
      x: '',
      resumeUrl: '',
    });
  });

  it('normalises bare domains when a section is saved, leaving full URLs alone', () => {
    const { value } = prepareSection('links', {
      ...createEmptyProfile().links,
      linkedin: 'linkedin.com/in/example',
      github: 'github.com/example',
      x: 'x.com/example',
      portfolio: 'https://example.dev/work?tab=1',
    });
    expect(value).toMatchObject({
      linkedin: 'https://linkedin.com/in/example',
      github: 'https://github.com/example',
      x: 'https://x.com/example',
      portfolio: 'https://example.dev/work?tab=1',
    });
  });
});
