import { describe, expect, it } from 'vitest';
import type { FieldDescriptor, Profile } from '@jobfill/types';
import { matchField } from './match';
import { planFill, planNotes, dateFormatHint, handleFromUrl, type PlanItem } from './plan';
import { classifyQuestion } from './questions';
import { field, options, sampleProfile } from './test-helpers';

/**
 * Coverage for the fields real job applications ask for beyond name/email/phone:
 * structured & permanent addresses, personal details, projects, skill categories,
 * link platforms, job preferences, work authorization, EEO and compliance — and the
 * safety rules: never guess, never overwrite, never tick consent.
 */

/** A fully filled-in Indian candidate profile. */
function richProfile(): Profile {
  const base = sampleProfile();
  return {
    ...base,
    personal: {
      ...base.personal,
      firstName: 'Nitin',
      middleName: '',
      lastName: 'Singh',
      email: 'nitin@example.com',
      phone: '+91 98765 43210',
      alternatePhone: '+91 91234 56789',
      address: 'Flat 302, Shanti Apartments, MG Road',
      addressLine2: 'Indiranagar',
      landmark: 'Near Metro Station',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      permanentSameAsCurrent: 'no',
      permanentAddress: {
        line1: '14 Civil Lines',
        line2: '',
        landmark: '',
        city: 'Lucknow',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        postalCode: '226001',
        country: 'India',
      },
      dateOfBirth: '1999-04-21',
      gender: 'Male',
      pronouns: 'He/Him',
      nationality: 'Indian',
      citizenship: 'India',
      maritalStatus: 'Single',
    },
    professional: {
      ...base.professional,
      currentTitle: 'Software Engineer',
      currentCompany: 'Acme Labs',
      yearsOfExperience: '3',
      currentSalary: '12 LPA',
      expectedSalary: '18 LPA',
      salaryCurrency: 'INR',
      noticePeriod: '30 days',
      earliestStartDate: '2026-11-15',
      preferredLocations: ['Bengaluru', 'Remote'],
      preferredWorkMode: 'hybrid',
      preferredJobTypes: ['full-time'],
      workAuthorization: 'Citizen',
      authorizedCountries: ['India'],
      requiresSponsorship: 'no',
      willingToRelocate: 'yes',
    },
    education: [
      {
        id: 'e1',
        level: "Bachelor's",
        degree: 'B.Tech',
        fieldOfStudy: 'Computer Science',
        institution: 'IIT Delhi',
        location: 'New Delhi',
        startDate: '2017-08',
        endDate: '2021-05',
        isCurrent: false,
        gpa: '8.6/10',
        description: '',
      },
      {
        id: 'e2',
        level: '12th',
        degree: 'Class XII (CBSE)',
        fieldOfStudy: 'Science',
        institution: 'Kendriya Vidyalaya',
        location: 'Lucknow',
        startDate: '2015-04',
        endDate: '2017-03',
        isCurrent: false,
        gpa: '94%',
        description: '',
      },
    ],
    experience: [
      {
        ...base.experience[0]!,
        company: 'Acme Labs',
        jobTitle: 'Software Engineer',
        isCurrent: true,
        startDate: '2021-07',
        reasonForLeaving: 'Looking for larger-scale product work.',
      },
    ],
    projects: [
      {
        id: 'p1',
        name: 'Ledger CLI',
        role: 'Sole developer',
        description: 'A command-line budgeting tool.',
        technologies: ['Rust', 'SQLite'],
        url: '',
        githubUrl: 'https://github.com/nitin/ledger',
        startDate: '2022-01',
        endDate: '2022-06',
        outcome: '',
      },
      {
        id: 'p2',
        name: 'Campus Events',
        role: 'Frontend lead',
        description: 'Event discovery app for students.',
        technologies: ['React', 'TypeScript', 'Firebase'],
        url: 'https://campus-events.app',
        githubUrl: 'https://github.com/nitin/campus-events',
        startDate: '2023-02',
        endDate: '2023-09',
        outcome: 'Used by 3 student societies.',
      },
      {
        id: 'p3',
        name: 'Portfolio site',
        role: '',
        description: 'Personal site.',
        technologies: ['Next.js'],
        url: 'https://nitin.dev',
        githubUrl: '',
        startDate: '',
        endDate: '',
        outcome: '',
      },
    ],
    skills: {
      technical: ['TypeScript', 'Python', 'React', 'Next.js', 'PostgreSQL', 'AWS', 'Docker'],
      soft: ['Communication'],
      languages: ['English', 'Hindi'],
    },
    links: {
      ...base.links,
      linkedin: 'https://linkedin.com/in/nitin-singh',
      github: 'https://github.com/nitin',
      other: [
        { id: 'o1', label: 'LeetCode', url: 'https://leetcode.com/u/nitin' },
        { id: 'o2', label: 'Kaggle', url: 'https://www.kaggle.com/nitin' },
      ],
    },
    additional: {
      disability: 'No',
      veteranStatus: 'I am not a protected veteran',
      ethnicity: '',
      backgroundCheck: 'yes',
      drugTest: '',
      criminalRecord: 'no',
      referralSource: 'LinkedIn',
      coverLetter: '',
    },
  };
}

let n = 0;
const f = (overrides: Partial<FieldDescriptor>) => field({ id: `f${n++}`, ...overrides });
const plan = (fields: Array<Partial<FieldDescriptor>>, profile = richProfile()) =>
  planFill(fields.map(f), profile);
const one = (overrides: Partial<FieldDescriptor>, profile = richProfile()): PlanItem =>
  plan([overrides], profile)[0]!;
const keyOf = (overrides: Partial<FieldDescriptor>) => {
  const m = matchField(field(overrides));
  return m.kind === 'match' ? m.key : m.kind;
};

describe('semantic detection: the same field, written many ways', () => {
  it.each<[string, Partial<FieldDescriptor>, string]>([
    ['name=fname', { name: 'fname' }, 'personal.firstName'],
    ['name=first_name', { name: 'first_name' }, 'personal.firstName'],
    ['name=candidateFirstName', { name: 'candidateFirstName' }, 'personal.firstName'],
    ['aria Given name', { ariaLabel: 'Given name' }, 'personal.firstName'],
    ['Surname', { label: 'Surname' }, 'personal.lastName'],
    ['name=lname', { name: 'lname' }, 'personal.lastName'],
    ['Mobile', { label: 'Mobile' }, 'personal.phone'],
    ['Contact number', { label: 'Contact number' }, 'personal.phone'],
    ['Alternate mobile number', { label: 'Alternate Mobile Number' }, 'personal.alternatePhone'],
    ['name=pincode', { name: 'pincode' }, 'personal.postalCode'],
    ['ZIP', { label: 'ZIP' }, 'personal.postalCode'],
    ['PIN Code', { label: 'PIN Code' }, 'personal.postalCode'],
    ['name=dob', { name: 'dob', type: 'date' }, 'personal.dateOfBirth'],
    ['Address Line 1', { label: 'Address Line 1' }, 'personal.address'],
    ['House / Flat No.', { label: 'House / Flat Number' }, 'personal.address'],
    ['Landmark', { label: 'Landmark' }, 'personal.landmark'],
    ['District', { label: 'District' }, 'personal.district'],
    [
      'Permanent Address (label)',
      { label: 'Permanent Address', type: 'textarea' },
      'permanent.address',
    ],
    [
      'City under Permanent Address',
      { label: 'City', section: 'Permanent Address' },
      'permanent.city',
    ],
    [
      'PIN under Permanent Address',
      { label: 'Pincode', section: 'Permanent Address' },
      'permanent.postalCode',
    ],
    [
      'same-as-current checkbox',
      { label: 'Permanent address same as current address', type: 'checkbox' },
      'personal.permanentSameAsCurrent',
    ],
    ['Gender radio', { label: 'Gender', type: 'radio' }, 'personal.gender'],
    ['Nationality', { label: 'Nationality' }, 'personal.nationality'],
    ['Marital status', { label: 'Marital Status', type: 'select' }, 'personal.maritalStatus'],
    [
      'Day under DOB',
      { label: 'Day', type: 'select', section: 'Date of Birth' },
      'personal.birthDay',
    ],
    [
      'Month under DOB',
      { label: 'Month', type: 'select', section: 'Date of Birth' },
      'personal.birthMonth',
    ],
    [
      'Year under DOB',
      { label: 'Year', type: 'select', section: 'Date of Birth' },
      'personal.birthYear',
    ],
    ['CGPA', { label: 'CGPA', section: 'Education' }, 'education.gpa'],
    ['Percentage', { label: 'Percentage', section: 'Education' }, 'education.gpa'],
    ['College name', { label: 'College Name' }, 'education.institution'],
    ['Course', { label: 'Course', section: 'Education' }, 'education.degree'],
    ['Education level', { label: 'Highest level of education', type: 'select' }, 'education.level'],
    ['Current CTC', { label: 'Current CTC' }, 'professional.currentSalary'],
    ['Expected CTC', { label: 'Expected CTC' }, 'professional.expectedSalary'],
    [
      'Reason for leaving',
      { label: 'Reason for leaving', type: 'textarea' },
      'professional.reasonForLeaving',
    ],
    [
      'Employer name in experience',
      { label: 'Employer Name', section: 'Work Experience' },
      'experience.company',
    ],
    ['Project name', { label: 'Project Name' }, 'project.name'],
    ['Name under Projects', { label: 'Name', section: 'Projects' }, 'project.name'],
    [
      'Project description',
      { label: 'Project Description', type: 'textarea' },
      'project.description',
    ],
    [
      'Tech stack under Projects',
      { label: 'Tech Stack', section: 'Projects' },
      'project.technologies',
    ],
    ['GitHub repository', { label: 'GitHub Repository' }, 'project.githubUrl'],
    ['Live demo', { label: 'Live Demo' }, 'project.url'],
    [
      'describe a project (textarea)',
      { label: 'Describe one project where you used React', type: 'textarea' },
      'project.summary',
    ],
    ['Programming languages', { label: 'Programming Languages' }, 'skills.programmingLanguages'],
    ['Frameworks', { label: 'Frameworks' }, 'skills.frameworks'],
    ['Technical skills', { label: 'Technical Skills' }, 'skills.technical'],
    ['LeetCode', { label: 'LeetCode Profile' }, 'links.leetcode'],
    ['Kaggle', { label: 'Kaggle' }, 'links.kaggle'],
    [
      'Preferred work location',
      { label: 'Preferred work location' },
      'professional.preferredLocations',
    ],
    [
      'Willing to relocate radio',
      { label: 'Are you willing to relocate?', type: 'radio' },
      'professional.willingToRelocate',
    ],
    [
      'Work mode',
      { label: 'Preferred work mode', type: 'select' },
      'professional.preferredWorkMode',
    ],
    [
      'Authorized in India',
      { label: 'Are you legally authorized to work in India?', type: 'radio' },
      'professional.authorizedToWork',
    ],
    [
      'Sponsorship',
      { label: 'Will you now or in the future require visa sponsorship?', type: 'radio' },
      'professional.requiresSponsorship',
    ],
    [
      'Criminal record',
      { label: 'Have you ever been convicted of a crime?', type: 'radio' },
      'additional.criminalRecord',
    ],
    [
      'Background check',
      { label: 'Are you willing to undergo a background check?', type: 'radio' },
      'additional.backgroundCheck',
    ],
    [
      'How did you hear',
      { label: 'How did you hear about this position?', type: 'select' },
      'additional.referralSource',
    ],
    ['Cover letter text', { label: 'Cover Letter', type: 'textarea' }, 'additional.coverLetter'],
    ['Cover letter file', { label: 'Upload cover letter', type: 'file' }, 'coverLetterFile'],
  ])('%s', (_name, overrides, expected) => {
    expect(keyOf(overrides)).toBe(expected);
  });

  it('never maps protected identity / personal data JobFill doesn’t collect', () => {
    expect(keyOf({ label: 'Aadhaar Number' })).toBe('sensitive');
    expect(keyOf({ label: 'PAN Card Number' })).toBe('sensitive');
    expect(keyOf({ label: 'Religion', type: 'select' })).toBe('sensitive');
    expect(keyOf({ label: 'Caste / Category', type: 'select' })).toBe('sensitive');
    expect(keyOf({ label: 'Passport number' })).toBe('sensitive');
  });

  it('never ticks consent / legal agreements', () => {
    expect(keyOf({ label: 'I consent to a background check', type: 'checkbox' })).toBe('sensitive');
    const item = one({ label: 'I agree to the terms and privacy policy', type: 'checkbox' });
    expect(item).toMatchObject({ status: 'review', action: null });
  });

  it('“Job location” is not the candidate’s home address', () => {
    expect(keyOf({ label: 'Job location' })).not.toBe('personal.location');
    expect(keyOf({ label: 'Current location' })).toBe('personal.location');
  });
});

describe('dates are never corrupted', () => {
  it('date inputs get ISO', () => {
    const item = one({ label: 'Date of Birth', type: 'date' });
    expect(item.action).toEqual({ kind: 'text', text: '1999-04-21' });
  });

  it.each([
    ['DD/MM/YYYY', '21/04/1999'],
    ['MM/DD/YYYY', '04/21/1999'],
    ['YYYY-MM-DD', '1999-04-21'],
    ['DD-MM-YYYY', '21-04-1999'],
    ['dd.mm.yyyy', '21.04.1999'],
  ])('text box with placeholder %s', (placeholder, expected) => {
    const item = one({ label: 'Date of birth', placeholder });
    expect(item).toMatchObject({ status: 'fill', action: { kind: 'text', text: expected } });
  });

  it('a full date with no stated format is left for the user, not guessed', () => {
    const item = one({ label: 'Date of birth' });
    expect(item.status).toBe('review');
    expect(item.action).toBeNull();
    expect(item.reason).toMatch(/1999-04-21/);
  });

  it('split Day / Month / Year dropdowns', () => {
    const days = options(...Array.from({ length: 31 }, (_, i) => String(i + 1)));
    const months = options('January', 'February', 'March', 'April', 'May');
    const years = options('2001', '2000', '1999', '1998');
    const [day, month, year] = plan([
      { label: 'Day', type: 'select', section: 'Date of Birth', options: days },
      { label: 'Month', type: 'select', section: 'Date of Birth', options: months },
      { label: 'Year', type: 'select', section: 'Date of Birth', options: years },
    ]);
    expect(day!.preview).toBe('21');
    expect(month!.preview).toBe('April');
    expect(year!.preview).toBe('1999');
  });

  it('reads the format from help text', () => {
    expect(dateFormatHint('Enter as DD/MM/YYYY')).toBe('DD/MM/YYYY');
    expect(dateFormatHint('mm-dd-yyyy')).toBe('MM-DD-YYYY');
    expect(dateFormatHint('Your name')).toBeNull();
  });

  it('“Are you at least 18?” is derived from the user’s own date of birth', () => {
    const item = one({
      label: 'Are you at least 18 years of age?',
      type: 'radio',
      options: options('Yes', 'No'),
    });
    expect(item).toMatchObject({ key: 'personal.age', preview: 'Yes' });
  });
});

describe('choices: select, radio, checkbox', () => {
  it('gender radio picks the user’s explicit answer', () => {
    const item = one({
      label: 'Gender',
      type: 'radio',
      options: options('Male', 'Female', 'Non-binary', 'Prefer not to say'),
    });
    expect(item).toMatchObject({ status: 'fill', preview: 'Male' });
  });

  it('gender aliases (“Man”)', () => {
    const item = one({
      label: 'Gender',
      type: 'select',
      options: options('Woman', 'Man', 'Other'),
    });
    expect(item.preview).toBe('Man');
  });

  it('empty gender is never guessed — even on an optional field', () => {
    const profile = richProfile();
    profile.personal.gender = '';
    const item = one(
      { label: 'Gender', type: 'radio', options: options('Male', 'Female') },
      profile,
    );
    expect(item).toMatchObject({ status: 'review', action: null, explicitOnly: true });
  });

  it('unanswered relocation is left for review, not answered “No”', () => {
    const profile = richProfile();
    profile.professional.willingToRelocate = '';
    const item = one(
      { label: 'Are you willing to relocate?', type: 'radio', options: options('Yes', 'No') },
      profile,
    );
    expect(item).toMatchObject({ status: 'review', action: null });
  });

  it('work mode and job type options', () => {
    const [mode, type] = plan([
      { label: 'Work mode', type: 'select', options: options('Remote', 'Hybrid', 'Onsite') },
      {
        label: 'Job type',
        type: 'select',
        options: options('Full Time', 'Internship', 'Contract'),
      },
    ]);
    expect(mode!.preview).toBe('Hybrid');
    expect(type!.preview).toBe('Full Time');
  });
});

describe('work authorization is never guessed', () => {
  const yesNo = options('Yes', 'No');
  it('Yes for a country the user listed', () => {
    const item = one({
      label: 'Are you legally authorized to work in India?',
      type: 'radio',
      options: yesNo,
    });
    expect(item).toMatchObject({ status: 'fill-review', preview: 'Yes' });
  });

  it('an unlisted country is left for the user — not answered “No”', () => {
    const item = one({
      label: 'Are you authorized to work in the United States?',
      type: 'radio',
      options: yesNo,
    });
    expect(item).toMatchObject({ status: 'review', action: null });
    expect(item.reason).toMatch(/United States/);
  });

  it('no country named → review', () => {
    const item = one({
      label: 'Are you legally authorized to work in this country?',
      type: 'radio',
      options: yesNo,
    });
    expect(item.status).toBe('review');
  });

  it('sponsorship uses the explicit answer', () => {
    const item = one({
      label: 'Do you require visa sponsorship?',
      type: 'radio',
      options: yesNo,
    });
    expect(item).toMatchObject({ status: 'fill-review', preview: 'No' });
  });
});

describe('addresses', () => {
  it('a lone “Address” box gets the full address', () => {
    const item = one({ label: 'Address', type: 'textarea' });
    expect(item.preview).toBe(
      'Flat 302, Shanti Apartments, MG Road, Indiranagar, Near Metro Station, Bengaluru, Bengaluru Urban, Karnataka, 560038, India',
    );
  });

  it('with City / PIN fields present, “Address” is line 1 only', () => {
    const [address, city, pin] = plan([
      { label: 'Address' },
      { label: 'City' },
      { label: 'PIN Code' },
    ]);
    expect(address!.preview).toBe('Flat 302, Shanti Apartments, MG Road');
    expect(city!.preview).toBe('Bengaluru');
    expect(pin!.preview).toBe('560038');
  });

  it('current and permanent sections are kept apart', () => {
    const [city, permCity, permState] = plan([
      { label: 'City', section: 'Current Address' },
      { label: 'City', section: 'Permanent Address' },
      { label: 'State', section: 'Permanent Address' },
    ]);
    expect(city!.preview).toBe('Bengaluru');
    expect(permCity!.preview).toBe('Lucknow');
    expect(permState!.preview).toBe('Uttar Pradesh');
  });

  it('“same as current” reuses the current address', () => {
    const profile = richProfile();
    profile.personal.permanentSameAsCurrent = 'yes';
    const [same, permCity] = plan(
      [
        { label: 'Permanent address same as current address', type: 'checkbox' },
        { label: 'City', section: 'Permanent Address' },
      ],
      profile,
    );
    expect(same!.action).toEqual({ kind: 'check', checked: true });
    expect(permCity!.preview).toBe('Bengaluru');
  });

  it('phone with a separate country-code field gets the national number', () => {
    const [code, phone] = plan([
      {
        label: 'Country code',
        type: 'select',
        options: options('United States (+1)', 'India (+91)', 'United Kingdom (+44)'),
      },
      { label: 'Mobile number', type: 'tel' },
    ]);
    expect(code!.preview).toBe('India (+91)');
    expect(phone!.preview).toBe('98765 43210');
  });

  it('without a country-code field the phone keeps its code', () => {
    expect(one({ label: 'Phone', type: 'tel' }).preview).toBe('+91 98765 43210');
  });
});

describe('projects', () => {
  it('“Describe one project where you used React” picks the React project', () => {
    const item = one({ label: 'Describe one project where you used React', type: 'textarea' });
    expect(item.entryIndex).toBe(1);
    expect(item.preview).toContain('Campus Events (Frontend lead): Event discovery app');
    expect(item.preview).toContain('Technologies: React, TypeScript, Firebase.');
    // Drafted from the user's words: filled, but flagged to read through.
    expect(item.status).toBe('fill-review');
  });

  it('repeated project sections fill in order', () => {
    const items = plan([
      { label: 'Project Name', section: 'Project 1' },
      { label: 'GitHub Repository', section: 'Project 1' },
      { label: 'Project Name', section: 'Project 2' },
      { label: 'GitHub Repository', section: 'Project 2' },
    ]);
    expect(items.map((i) => i.preview)).toEqual([
      'Ledger CLI',
      'https://github.com/nitin/ledger',
      'Campus Events',
      'https://github.com/nitin/campus-events',
    ]);
  });

  it('notes when the profile has more projects than the form has sections', () => {
    const profile = richProfile();
    const items = plan(
      [{ label: 'Project Name' }, { label: 'Project Description', type: 'textarea' }],
      profile,
    );
    expect(planNotes(items, profile)).toEqual([expect.stringMatching(/2 more projects/)]);
  });
});

describe('skills and links', () => {
  it('category questions only get matching skills', () => {
    const [langs, fw, db, cloud] = plan([
      { label: 'Programming languages' },
      { label: 'Frameworks' },
      { label: 'Databases' },
      { label: 'Cloud technologies' },
    ]);
    // Includes Rust from the user's own experience / project skills — nothing invented.
    expect(langs!.preview).toBe('TypeScript, Python, Rust');
    expect(fw!.preview).toBe('React, Next.js');
    expect(db!.preview).toBe('PostgreSQL, SQLite, Firebase');
    expect(cloud!.preview).toBe('AWS, Docker, Firebase');
  });

  it('platform links come from any saved link', () => {
    const [leetcode, kaggle, hackerrank] = plan([
      { label: 'LeetCode profile', type: 'url' },
      { label: 'Kaggle', type: 'url' },
      { label: 'HackerRank', type: 'url' },
    ]);
    expect(leetcode!.preview).toBe('https://leetcode.com/u/nitin');
    expect(kaggle!.preview).toBe('https://www.kaggle.com/nitin');
    expect(hackerrank!.status).toBe('skip'); // not in the profile, optional
  });

  it('“GitHub username” gets the handle, not the URL', () => {
    expect(one({ label: 'GitHub username' }).preview).toBe('nitin');
    expect(handleFromUrl('https://linkedin.com/in/nitin-singh/')).toBe('nitin-singh');
  });
});

describe('user input is never overwritten', () => {
  it('already-filled fields are skipped; the value is only offered for an explicit replace', () => {
    const item = one({ label: 'Technical Skills', hasValue: true });
    expect(item).toMatchObject({ status: 'skip', replaceable: true });
  });
});

describe('question classification', () => {
  it.each([
    ['Why do you want to work here?', 'MOTIVATION'],
    ['Why are you interested in this role?', 'MOTIVATION'],
    ['Tell us about yourself.', 'PERSONAL'],
    ['Describe your experience with React.', 'TECHNICAL'],
    ['Tell us about your most challenging project.', 'PROJECT'],
    ['What are your career goals?', 'CAREER'],
    ['What is your biggest achievement?', 'ACHIEVEMENT'],
    ['Describe your leadership experience.', 'LEADERSHIP'],
    ['What are your strengths?', 'SKILL'],
    ['Why are you leaving your current job?', 'CAREER'],
    ['How did you hear about this position?', 'REFERRAL'],
    ['What is your expected CTC?', 'SALARY'],
    ['What is your notice period?', 'AVAILABILITY'],
    ['Do you require sponsorship?', 'WORK_AUTHORIZATION'],
    ['Have you previously worked for us?', 'COMPLIANCE'],
    ['Anything else you’d like us to know?', 'GENERAL'],
  ])('%s → %s', (question, category) => {
    expect(classifyQuestion(question)).toBe(category);
  });

  it('open questions carry their category and are never answered', () => {
    const item = one({ label: 'Why do you want to join us?', type: 'textarea' });
    expect(item).toMatchObject({ openEnded: true, category: 'MOTIVATION', action: null });
  });
});
