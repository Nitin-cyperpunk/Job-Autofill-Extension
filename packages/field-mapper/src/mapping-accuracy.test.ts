import { describe, expect, it } from 'vitest';
import type { FieldDescriptor, FieldKey } from '@jobfill/types';
import { RULES, containsPhrase, matchField, normalizeText } from './index';
import { field, options } from './test-helpers';

/**
 * Mapping accuracy corpus. Each row is a field as it appears on real application
 * forms (ATS, Google Forms, custom React/Angular forms) and what it should map to.
 * `null` = must NOT be mapped; 'sensitive' = must be left for the user.
 *
 * The corpus must stay at 100%. When a real site maps wrongly, add its field here.
 */
type Expected = FieldKey | null | 'sensitive';
type Case = [description: string, field: Partial<FieldDescriptor>, expected: Expected];

const CORPUS: Case[] = [
  // ---- First name (examples from the spec) ----
  ['"first name"', { label: 'first name' }, 'personal.firstName'],
  ['"firstname" (joined, in name attr)', { name: 'firstname' }, 'personal.firstName'],
  ['"given name"', { label: 'Given name' }, 'personal.firstName'],
  ['"candidate first name"', { label: 'Candidate First Name *' }, 'personal.firstName'],
  ['camelCase id', { htmlId: 'applicantFirstName' }, 'personal.firstName'],
  ['snake_case name', { name: 'first_name' }, 'personal.firstName'],
  ['fname', { name: 'fname' }, 'personal.firstName'],
  ['placeholder only', { placeholder: 'Enter your first name' }, 'personal.firstName'],
  ['aria-label only', { ariaLabel: 'Legal first name' }, 'personal.firstName'],
  ['nearby text only', { nearbyText: 'First name', labelSource: 'nearby' }, 'personal.firstName'],
  [
    'autocomplete wins over odd label',
    { label: 'Field 12', autocomplete: 'given-name' },
    'personal.firstName',
  ],

  // ---- Other name parts ----
  ['last name', { label: 'Last name' }, 'personal.lastName'],
  ['surname', { label: 'Surname' }, 'personal.lastName'],
  ['family name', { label: 'Family Name' }, 'personal.lastName'],
  ['lname', { name: 'lname' }, 'personal.lastName'],
  ['middle name', { label: 'Middle name' }, 'personal.middleName'],
  ['preferred name', { label: 'Preferred first name' }, 'personal.preferredName'],
  ['nickname', { label: 'Nickname' }, 'personal.preferredName'],
  ['full name', { label: 'Full name' }, 'personal.fullName'],
  ['name', { label: 'Name' }, 'personal.fullName'],
  ['your name', { label: 'Your name *' }, 'personal.fullName'],
  ['first and last name', { label: 'First and last name' }, 'personal.fullName'],
  ['autocomplete name', { autocomplete: 'name' }, 'personal.fullName'],

  // ---- Email (examples from the spec) ----
  ['"email"', { label: 'email' }, 'personal.email'],
  ['"email address"', { label: 'Email address' }, 'personal.email'],
  ['"candidate email"', { label: 'Candidate email' }, 'personal.email'],
  ['"e-mail"', { label: 'E-mail' }, 'personal.email'],
  ['E-Mail Address', { label: 'E-Mail Address:' }, 'personal.email'],
  ['emailAddress id', { htmlId: 'emailAddress' }, 'personal.email'],
  ['confirm email', { label: 'Confirm email' }, 'personal.email'],
  ['type=email fallback', { type: 'email', label: 'Contact' }, 'personal.email'],

  // ---- Phone (examples from the spec) ----
  ['"phone"', { label: 'phone' }, 'personal.phone'],
  ['"mobile"', { label: 'Mobile' }, 'personal.phone'],
  ['"mobile number"', { label: 'Mobile number' }, 'personal.phone'],
  ['"telephone"', { label: 'Telephone' }, 'personal.phone'],
  ['Mobile No.', { label: 'Mobile No.' }, 'personal.phone'],
  ['phone_number', { name: 'phone_number' }, 'personal.phone'],
  ['contact number', { label: 'Contact number' }, 'personal.phone'],
  ['type=tel fallback', { type: 'tel', label: 'Best way to reach you' }, 'personal.phone'],

  // ---- Address ----
  ['address', { label: 'Address' }, 'personal.address'],
  ['street address', { label: 'Street address' }, 'personal.address'],
  ['address line 1', { label: 'Address Line 1' }, 'personal.address'],
  ['address1 name', { name: 'address1' }, 'personal.address'],
  ['city', { label: 'City' }, 'personal.city'],
  ['town/city', { label: 'Town / City' }, 'personal.city'],
  ['state', { label: 'State' }, 'personal.state'],
  ['province', { label: 'State / Province' }, 'personal.state'],
  ['zip', { label: 'ZIP' }, 'personal.postalCode'],
  ['zip code', { label: 'Zip Code' }, 'personal.postalCode'],
  ['postal code', { label: 'Postal code' }, 'personal.postalCode'],
  ['PIN code', { label: 'PIN Code' }, 'personal.postalCode'],
  ['postcode', { name: 'postcode' }, 'personal.postalCode'],
  ['country', { label: 'Country', type: 'select' }, 'personal.country'],
  ['country of residence', { label: 'Country of residence' }, 'personal.country'],
  ['location', { label: 'Location' }, 'personal.location'],
  ['current location', { label: 'Current location (city, country)' }, 'personal.location'],

  // ---- Links ----
  ['LinkedIn', { label: 'LinkedIn' }, 'links.linkedin'],
  ['LinkedIn profile URL', { label: 'LinkedIn Profile URL' }, 'links.linkedin'],
  ['linkedin_url name', { name: 'linkedin_url' }, 'links.linkedin'],
  ['GitHub', { label: 'GitHub' }, 'links.github'],
  ['github username', { label: 'GitHub username' }, 'links.github'],
  ['Portfolio', { label: 'Portfolio' }, 'links.portfolio'],
  ['portfolio link', { label: 'Link to your portfolio' }, 'links.portfolio'],
  ['Website', { label: 'Website' }, 'links.website'],
  ['personal website', { label: 'Personal website' }, 'links.website'],
  ['blog', { label: 'Blog' }, 'links.website'],

  // ---- Education ----
  ['school', { label: 'School' }, 'education.institution'],
  ['university', { label: 'University' }, 'education.institution'],
  ['college name', { label: 'College name' }, 'education.institution'],
  ['institution', { label: 'Name of institution' }, 'education.institution'],
  ['degree', { label: 'Degree' }, 'education.degree'],
  ['highest qualification', { label: 'Highest qualification', type: 'select' }, 'education.degree'],
  ['field of study', { label: 'Field of study' }, 'education.fieldOfStudy'],
  ['major', { label: 'Major' }, 'education.fieldOfStudy'],
  ['discipline', { label: 'Discipline' }, 'education.fieldOfStudy'],
  ['gpa', { label: 'GPA' }, 'education.gpa'],
  ['cgpa', { label: 'CGPA' }, 'education.gpa'],
  ['cumulative gpa', { label: 'Cumulative GPA' }, 'education.gpa'],
  ['graduation year', { label: 'Graduation year' }, 'education.endDate'],
  [
    'start date in Education section',
    { label: 'Start date', type: 'month', section: 'Education' },
    'education.startDate',
  ],
  [
    'end date in Education section',
    { label: 'End date', type: 'month', section: 'Education' },
    'education.endDate',
  ],
  [
    '"From" with edu name',
    { label: 'From', type: 'date', name: 'education[0][from]' },
    'education.startDate',
  ],

  // ---- Experience / company / title ----
  ['company', { label: 'Company' }, 'professional.currentCompany'],
  ['current company', { label: 'Current company' }, 'professional.currentCompany'],
  ['current employer', { label: 'Current employer' }, 'professional.currentCompany'],
  [
    'name of current employer',
    { label: 'Name of current employer' },
    'professional.currentCompany',
  ],
  ['job title', { label: 'Job title' }, 'professional.currentTitle'],
  ['current title', { label: 'Current title' }, 'professional.currentTitle'],
  ['current role', { label: 'Current role' }, 'professional.currentTitle'],
  [
    'company in Experience section',
    { label: 'Company', section: 'Work Experience' },
    'experience.company',
  ],
  [
    'employer in Employment section',
    { label: 'Employer', section: 'Employment history' },
    'experience.company',
  ],
  ['title in Experience section', { label: 'Title', section: 'Experience' }, 'experience.jobTitle'],
  [
    'position in Experience section',
    { label: 'Position', section: 'Experience' },
    'experience.jobTitle',
  ],
  [
    'start date in Experience section',
    { label: 'Start date', type: 'month', section: 'Experience' },
    'experience.startDate',
  ],
  [
    'end date via name',
    { label: 'To', type: 'text', name: 'experience_0_to' },
    'experience.endDate',
  ],
  [
    'description in Experience section',
    { label: 'Description', type: 'textarea', section: 'Experience' },
    'experience.description',
  ],
  [
    'currently work here checkbox',
    { label: 'I currently work here', type: 'checkbox' },
    'experience.isCurrent',
  ],
  ['years of experience', { label: 'Years of experience' }, 'professional.yearsOfExperience'],
  [
    'total experience select',
    { label: 'Total experience', type: 'select' },
    'professional.yearsOfExperience',
  ],
  [
    'how many years',
    { label: 'How many years of experience do you have with Python?', type: 'radio' },
    'professional.yearsOfExperience',
  ],

  // ---- Skills ----
  ['skills', { label: 'Skills' }, 'skills.technical'],
  ['key skills', { label: 'Key skills', type: 'textarea' }, 'skills.technical'],
  ['technical skills', { label: 'Technical skills' }, 'skills.technical'],
  ['tech stack', { label: 'Tech stack' }, 'skills.technical'],
  ['languages spoken', { label: 'Languages spoken' }, 'skills.languages'],
  ['soft skills', { label: 'Soft skills' }, 'skills.soft'],

  // ---- Other professional questions ----
  ['expected salary', { label: 'Expected salary' }, 'professional.expectedSalary'],
  [
    'salary expectations',
    { label: 'What are your salary expectations?' },
    'professional.expectedSalary',
  ],
  ['expected CTC', { label: 'Expected CTC' }, 'professional.expectedSalary'],
  ['notice period', { label: 'Notice period' }, 'professional.noticePeriod'],
  [
    'sponsorship radio',
    { label: 'Will you now or in the future require visa sponsorship?', type: 'radio' },
    'professional.requiresSponsorship',
  ],
  [
    'work authorization radio',
    { label: 'Are you legally authorized to work in the UK?', type: 'radio' },
    'professional.workAuthorization',
  ],
  [
    'relocate',
    { label: 'Are you willing to relocate?', type: 'radio' },
    'professional.willingToRelocate',
  ],
  ['summary', { label: 'Professional summary', type: 'textarea' }, 'professional.summary'],
  ['about you', { label: 'Tell us about yourself', type: 'textarea' }, 'professional.summary'],
  ['preferred locations', { label: 'Preferred work location' }, 'professional.preferredLocations'],

  // ---- Files ----
  ['resume upload', { label: 'Upload resume', type: 'file' }, 'resume'],
  ['CV upload', { label: 'CV', type: 'file' }, 'resume'],
  ['Résumé', { label: 'Résumé/CV', type: 'file' }, 'resume'],
  ['cover letter file', { label: 'Cover letter', type: 'file' }, null],
  ['photo file', { label: 'Profile photo', type: 'file' }, null],

  // ---- Automation / test ids (Workday data-automation-id, data-testid, formcontrolname) ----
  [
    'Workday first name id',
    { label: 'Field', dataHints: 'formField-legalNameSection_firstName' },
    'personal.firstName',
  ],
  ['Workday address line id', { dataHints: 'addressSection_addressLine1' }, 'personal.address'],
  ['Workday phone-number id', { dataHints: 'phone-number' }, 'personal.phone'],
  ['Angular formcontrolname', { dataHints: 'emailAddress' }, 'personal.email'],
  ['Lever urls[GitHub] name', { name: 'urls[GitHub]' }, 'links.github'],
  [
    'Lever "org" with label text',
    { name: 'org', nearbyText: 'Current company', labelSource: 'nearby' },
    'professional.currentCompany',
  ],
  ['Workday phone device type', { label: 'Phone Device Type', type: 'select' }, null],
  ['why work here', { label: 'Why do you want to work here?', type: 'textarea' }, null],

  // ---- False friends: must NOT map to the candidate's data ----
  ['reference name', { label: 'Reference name' }, null],
  ['reference phone', { label: 'Reference phone number' }, null],
  ['emergency contact phone', { label: 'Emergency contact phone' }, null],
  ['hiring manager email', { label: 'Hiring manager email' }, null],
  ['referrer name', { label: 'Referrer name' }, null],
  ['company name of reference', { label: 'Company website' }, null],
  ['username', { label: 'Username' }, null],
  [
    'salutation title',
    { label: 'Title (Mr/Ms)', type: 'select', options: options('Mr', 'Ms') },
    null,
  ],
  ['position applied for', { label: 'Position you are applying for' }, null],
  ['how did you hear', { label: 'How did you hear about us?' }, null],
  ['earliest start date (no section)', { label: 'Earliest start date', type: 'date' }, null],
  ['current salary', { label: 'Current salary' }, null],
  ['phone country code', { label: 'Phone country code', type: 'select' }, null],
  ['address line 2', { label: 'Address line 2' }, null],
  [
    'privacy notice checkbox',
    { label: 'I have read the privacy notice', type: 'checkbox' },
    'sensitive',
  ],

  // ---- Sensitive: never answered automatically ----
  ['gender', { label: 'Gender', type: 'select' }, 'sensitive'],
  ['pronouns', { label: 'Pronouns' }, 'sensitive'],
  ['race/ethnicity', { label: 'Race / Ethnicity', type: 'radio' }, 'sensitive'],
  ['veteran status', { label: 'Veteran status', type: 'select' }, 'sensitive'],
  ['disability', { label: 'Do you have a disability?', type: 'radio' }, 'sensitive'],
  ['date of birth', { label: 'Date of birth', type: 'date' }, 'sensitive'],
  ['over 18', { label: 'Are you at least 18 years of age?', type: 'radio' }, 'sensitive'],
  ['SSN', { label: 'SSN' }, 'sensitive'],
  [
    'terms consent',
    { label: 'I agree to the terms and conditions', type: 'checkbox' },
    'sensitive',
  ],
  ['data consent', { label: 'I consent to my data being stored', type: 'checkbox' }, 'sensitive'],
];

function actual(f: FieldDescriptor): Expected {
  const m = matchField(f);
  return m.kind === 'match' ? m.key : m.kind === 'sensitive' ? 'sensitive' : null;
}

describe('mapping accuracy corpus', () => {
  it.each(CORPUS)('%s', (_description, overrides, expected) => {
    expect(actual(field(overrides))).toBe(expected);
  });

  it('scores 100% on the whole corpus', () => {
    const misses = CORPUS.filter(
      ([, overrides, expected]) => actual(field(overrides)) !== expected,
    ).map(([d]) => d);
    const accuracy = (100 * (CORPUS.length - misses.length)) / CORPUS.length;
    expect(misses, `accuracy ${accuracy.toFixed(1)}% on ${CORPUS.length} cases`).toEqual([]);
  });
});

describe('normalizeText', () => {
  it.each([
    ["Candidate's First-Name *", 'first name'],
    ['emailAddress', 'email address'],
    ['E-mail', 'email'],
    ['Mobile No.', 'mobile number'],
    ['Résumé', 'resume'],
    ['Please enter your ZIP/Postal Code', 'zip postal code'],
    ['LinkedIn', 'linkedin'],
    ['address1', 'address 1'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
});

describe('dictionary consistency', () => {
  it('no phrase or exclude normalizes to nothing', () => {
    for (const rule of RULES) {
      for (const text of [...rule.phrases, ...(rule.exclude ?? [])]) {
        expect(normalizeText(text), `${rule.key}: "${text}"`).not.toBe('');
      }
    }
  });

  it('no rule excludes its own phrases', () => {
    for (const rule of RULES) {
      const excludes = (rule.exclude ?? []).map(normalizeText);
      for (const phrase of rule.phrases.map(normalizeText)) {
        const clash = excludes.find((ex) => containsPhrase(phrase, ex));
        expect(clash, `${rule.key}: phrase "${phrase}" is excluded by "${clash}"`).toBeUndefined();
      }
    }
  });
});

describe('signal weighting', () => {
  it('trusts the label over a misleading id', () => {
    expect(actual(field({ label: 'Email', htmlId: 'phone' }))).toBe('personal.email');
  });

  it('flags nearby-text-only matches as lower confidence', () => {
    const fromLabel = matchField(field({ label: 'Phone' }));
    const fromNearby = matchField(field({ nearbyText: 'Phone', labelSource: 'nearby' }));
    expect(fromLabel.kind === 'match' && fromNearby.kind === 'match').toBe(true);
    if (fromLabel.kind === 'match' && fromNearby.kind === 'match') {
      expect(fromNearby.confidence).toBeLessThan(fromLabel.confidence);
    }
  });

  it('does not map file inputs to text keys, or text inputs to resume', () => {
    expect(actual(field({ label: 'Email', type: 'file' }))).toBeNull();
    expect(actual(field({ label: 'Resume', type: 'text' }))).toBeNull();
  });
});
