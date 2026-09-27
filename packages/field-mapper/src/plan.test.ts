import { describe, expect, it } from 'vitest';
import type { FieldDescriptor } from '@jobfill/types';
import {
  chooseOptions,
  degreeLevel,
  isPlaceholderOption,
  optionPolarity,
  parseRange,
  planFill,
  resolveProfileValue,
  type PlanItem,
} from './index';
import { field, options, sampleProfile } from './test-helpers';

describe('option matching', () => {
  it('skips placeholder options', () => {
    expect(isPlaceholderOption({ value: '', label: 'Select…', selected: true })).toBe(true);
    expect(isPlaceholderOption({ value: '', label: '-- Choose --', selected: false })).toBe(true);
    expect(isPlaceholderOption({ value: 'IN', label: 'India', selected: false })).toBe(false);
  });

  it.each([
    ['Yes', true],
    ['No', false],
    ['Yes, I will require sponsorship', true],
    ['No, I will not', false],
    ['I am not authorized', false],
    ['Maybe', null],
  ])('polarity of %j is %s', (label, expected) => {
    expect(optionPolarity(label)).toBe(expected);
  });

  it('answers yes/no questions from booleans', () => {
    const opts = options('Select one', 'Yes', 'No');
    expect(chooseOptions(opts, { kind: 'bool', value: false })?.indices).toEqual([2]);
    expect(chooseOptions(opts, { kind: 'bool', value: true })?.indices).toEqual([1]);
  });

  it.each([
    ['0-2 years', [0, 2]],
    ['3 – 5 years', [3, 5]],
    ['5+ years', [5, Infinity]],
    ['10 or more', [10, Infinity]],
    ['Less than 1 year', [0, 1 - 1e-9]],
    ['Fresher', [0, 0]],
  ])('parses range %j', (label, expected) => {
    expect(parseRange(label)).toEqual(expected);
  });

  it('picks the experience bracket containing the value', () => {
    const opts = options(
      'Less than 1 year',
      '1-3 years',
      '4-6 years',
      '7-10 years',
      'More than 10 years',
    );
    expect(chooseOptions(opts, { kind: 'number', value: 7, text: '7' })?.indices).toEqual([3]);
    expect(chooseOptions(opts, { kind: 'number', value: 12, text: '12' })?.indices).toEqual([4]);
  });

  it('matches countries through aliases', () => {
    const opts = [
      { value: 'US', label: 'United States of America', selected: false },
      { value: 'GB', label: 'UK', selected: false },
    ];
    expect(chooseOptions(opts, { kind: 'text', text: 'United Kingdom' })?.indices).toEqual([1]);
    expect(chooseOptions(opts, { kind: 'text', text: 'USA' })?.indices).toEqual([0]);
  });

  it('matches degree levels across spellings', () => {
    expect(degreeLevel('B.Sc.')).toBe('bachelor');
    expect(degreeLevel('Master of Science')).toBe('master');
    expect(degreeLevel('Ph.D.')).toBe('phd');
    const opts = options('High School', "Bachelor's Degree", "Master's Degree", 'Doctorate');
    expect(chooseOptions(opts, { kind: 'text', text: 'M.Sc.' })?.indices).toEqual([2]);
  });

  it('checks every matching box in a checkbox group', () => {
    const opts = options('TypeScript', 'Go', 'React', 'SQL');
    expect(
      chooseOptions(opts, { kind: 'list', items: ['react', 'SQL', 'Rust'] }, true)?.indices,
    ).toEqual([2, 3]);
  });

  it('returns null instead of guessing', () => {
    expect(chooseOptions(options('Red', 'Blue'), { kind: 'text', text: 'Mathematics' })).toBeNull();
    expect(chooseOptions(options('Maybe', 'Later'), { kind: 'bool', value: true })).toBeNull();
  });
});

describe('value resolution', () => {
  const profile = sampleProfile();

  it('derives full name and location', () => {
    expect(resolveProfileValue(profile, 'personal.fullName')).toEqual({
      kind: 'text',
      text: 'Ada Lovelace',
    });
    expect(resolveProfileValue(profile, 'personal.location')).toEqual({
      kind: 'text',
      text: 'London, Greater London, United Kingdom',
    });
  });

  it('indexes into education and experience', () => {
    expect(resolveProfileValue(profile, 'education.institution', 1)).toEqual({
      kind: 'text',
      text: 'Cambridge',
    });
    expect(resolveProfileValue(profile, 'education.institution', 5)).toBeNull();
    expect(resolveProfileValue(profile, 'experience.endDate', 0)).toBeNull(); // current role
    expect(resolveProfileValue(profile, 'experience.endDate', 1)).toEqual({
      kind: 'month',
      month: '2020-02',
    });
  });

  it('returns null for empty values', () => {
    const empty = { ...profile, personal: { ...profile.personal, middleName: '' } };
    expect(resolveProfileValue(empty, 'personal.middleName')).toBeNull();
  });
});

describe('planFill', () => {
  const profile = sampleProfile();
  const plan = (fields: Array<Partial<FieldDescriptor>>): PlanItem[] =>
    planFill(
      fields.map((f, i) => field({ id: `f${i}`, ...f })),
      profile,
    );

  it('fills confident text matches', () => {
    const [first, email] = plan([{ label: 'First Name' }, { label: 'Email', type: 'email' }]);
    expect(first).toMatchObject({
      status: 'fill',
      key: 'personal.firstName',
      action: { kind: 'text', text: 'Ada' },
    });
    expect(email).toMatchObject({
      status: 'fill',
      action: { kind: 'text', text: 'ada@example.com' },
    });
  });

  it('never overwrites a field that already has a value', () => {
    const [item] = plan([{ label: 'First Name', hasValue: true }]);
    expect(item).toMatchObject({ status: 'skip', reason: 'Already filled', action: null });
  });

  it('leaves sensitive questions to the user, flagging required ones', () => {
    const [optional, required] = plan([
      { label: 'Gender', type: 'select', options: options('Female', 'Male') },
      { label: 'Veteran status', type: 'radio', required: true, options: options('Yes', 'No') },
    ]);
    expect(optional).toMatchObject({ status: 'skip', action: null });
    expect(required).toMatchObject({ status: 'review', action: null });
  });

  it('never ticks consent boxes', () => {
    const [item] = plan([
      {
        label: 'I agree to the privacy policy',
        type: 'checkbox',
        required: true,
        options: options('on'),
      },
    ]);
    expect(item).toMatchObject({ status: 'review', action: null });
  });

  it('flags required fields it cannot answer', () => {
    const [item] = plan([{ label: 'How did you hear about us?', required: true }]);
    expect(item).toMatchObject({ status: 'review', reason: 'No matching profile field' });
  });

  it('fills repeated education sections in order', () => {
    const items = plan([
      { label: 'School', section: 'Education' },
      { label: 'School', section: 'Education' },
    ]);
    expect(items.map((i) => i.preview)).toEqual(['University of London', 'Cambridge']);
  });

  it('answers yes/no radios from booleans', () => {
    const [relocate, sponsor] = plan([
      { label: 'Are you willing to relocate?', type: 'radio', options: options('Yes', 'No') },
      { label: 'Will you require visa sponsorship?', type: 'radio', options: options('Yes', 'No') },
    ]);
    expect(relocate).toMatchObject({
      status: 'fill',
      action: { kind: 'options', indices: [0] },
      preview: 'Yes',
    });
    // Legal questions are filled but always flagged for review.
    expect(sponsor).toMatchObject({
      status: 'fill-review',
      action: { kind: 'options', indices: [1] },
      preview: 'No',
    });
  });

  it('derives work-authorization yes/no from the profile text, with review', () => {
    const [item] = plan([
      {
        label: 'Are you legally authorized to work in the UK?',
        type: 'radio',
        options: options('Yes', 'No'),
      },
    ]);
    expect(item).toMatchObject({
      status: 'fill-review',
      action: { kind: 'options', indices: [0] },
    });
  });

  it('selects matching options and reports when none match', () => {
    const [country, degree] = plan([
      {
        label: 'Country',
        type: 'select',
        options: [
          { value: '', label: 'Select…', selected: true },
          ...options('India', 'United Kingdom'),
        ],
      },
      { label: 'Degree', type: 'select', options: options('Diploma', 'Doctorate') },
    ]);
    expect(country).toMatchObject({ status: 'fill', action: { kind: 'options', indices: [2] } });
    expect(degree).toMatchObject({ status: 'review', action: null, preview: 'M.Sc.' });
    expect(degree!.reason).toMatch(/No option matches/);
  });

  it('formats dates for the input type', () => {
    const items = plan([
      { label: 'Start date', type: 'month', section: 'Experience' },
      { label: 'Start date', type: 'date', section: 'Experience' },
      { label: 'Graduation date', type: 'text' },
    ]);
    expect(items.map((i) => i.action)).toEqual([
      { kind: 'text', text: '2020-03' },
      { kind: 'text', text: '2016-07-01' }, // second occurrence → second role
      { kind: 'text', text: '06/2016' },
    ]);
  });

  it('attaches the resume to resume upload fields only', () => {
    const [resume, cover] = plan([
      { label: 'Upload resume', type: 'file' },
      { label: 'Cover letter', type: 'file', required: true },
    ]);
    expect(resume).toMatchObject({
      status: 'fill',
      action: { kind: 'file' },
      preview: 'ada-resume.pdf',
    });
    expect(cover).toMatchObject({ status: 'review' });
  });

  it('checks the lone "I currently work here" box from the profile', () => {
    const [item] = plan([
      { label: 'I currently work here', type: 'checkbox', options: options('on') },
    ]);
    expect(item).toMatchObject({ status: 'fill', action: { kind: 'check', checked: true } });
  });

  it('marks weak matches for review', () => {
    const [item] = plan([{ nearbyText: 'Phone', labelSource: 'nearby' }]);
    expect(item!.status).toBe('fill-review');
  });

  it('leaves custom (ARIA) dropdowns for the user', () => {
    const [item] = plan([
      {
        label: 'Country',
        type: 'select',
        widget: 'aria',
        required: true,
        options: options('India', 'United Kingdom'),
      },
    ]);
    expect(item).toMatchObject({ status: 'review', action: null });
  });
});
