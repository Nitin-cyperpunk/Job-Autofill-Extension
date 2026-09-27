import { describe, expect, it } from 'vitest';
import {
  buildExportFile,
  computeCompleteness,
  createEducationEntry,
  createEmptyProfile,
  createExperienceEntry,
  migrateProfileV1,
  normalizeProfile,
  parseImportFile,
  prepareSection,
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
    city: 'London',
  };
  p.professional = {
    ...p.professional,
    currentTitle: 'Engineer',
    summary: 'Hi',
    yearsOfExperience: '5',
    workAuthorization: 'Citizen',
  };
  p.education = [{ ...createEducationEntry(), institution: 'Cambridge' }];
  p.experience = [
    { ...createExperienceEntry(), company: 'Analytical Engines', jobTitle: 'Engineer' },
  ];
  p.projects = [
    { id: 'p1', name: 'Notes', description: '', technologies: [], url: '', githubUrl: '' },
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
      willingToRelocate: true,
    });
    expect(p.links.github).toBe('https://github.com/ada');
    expect(p.onboardingCompletedAt).toBe('2026-01-01T00:00:00.000Z');
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

describe('computeCompleteness', () => {
  it('is 0 for an empty profile and 100 for a full one', () => {
    expect(computeCompleteness(createEmptyProfile()).percent).toBe(0);
    expect(computeCompleteness(filledProfile()).percent).toBe(100);
  });

  it('gives partial credit with hints', () => {
    const p = createEmptyProfile();
    p.personal.email = 'a@b.co';
    const result = computeCompleteness(p);
    expect(result.percent).toBe(6); // 25 * 1/4, rounded
    expect(result.items.find((i) => i.id === 'personal')?.missing).toContain('Phone');
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
