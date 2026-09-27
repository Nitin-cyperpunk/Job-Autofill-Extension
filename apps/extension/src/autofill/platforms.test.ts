// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planFill, type PlanItem } from '@jobfill/field-mapper';
import { detectFields } from '@/field-detection';
import { sampleProfile } from '../../../../packages/field-mapper/src/test-helpers';

/**
 * Platform patterns (Greenhouse, Lever, Workday-style) through the generic
 * detection + mapping pipeline — no site adapters involved.
 */

function loadPage(name: string, templateId?: string) {
  const html = readFileSync(resolve(process.cwd(), 'apps/extension/test-pages', name), 'utf8');
  document.documentElement.innerHTML = html
    .replace(/<!doctype[^>]*>/i, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  if (templateId) {
    const step = document.getElementById('step')!;
    step.replaceChildren(
      (document.getElementById(templateId) as HTMLTemplateElement).content.cloneNode(true),
    );
  }
}

const isVisible = (el: Element) =>
  !el.closest('.visually-hidden, .invisible-resume-upload, template');

function plan(): Record<string, PlanItem> {
  const items = planFill(
    detectFields(document, { isVisible }).map((f) => f.descriptor),
    sampleProfile(),
  );
  return Object.fromEntries(items.map((i) => [i.label, i]));
}

const summary = (items: Record<string, PlanItem>) =>
  Object.fromEntries(
    Object.entries(items).map(([label, i]) => [
      label,
      i.key ??
        (i.status === 'skip' || i.status === 'review'
          ? i.why.startsWith('Personal') || i.why.startsWith('Consent')
            ? 'left for user'
            : 'unmapped'
          : 'unmapped'),
    ]),
  );

describe('Greenhouse-style board', () => {
  it('maps every field generically', () => {
    loadPage('greenhouse.html');
    expect(summary(plan())).toEqual({
      'First Name': 'personal.firstName',
      'Last Name': 'personal.lastName',
      Email: 'personal.email',
      Phone: 'personal.phone',
      Country: 'personal.country',
      'Resume/CV': 'resume',
      'LinkedIn Profile': 'links.linkedin',
      Website: 'links.website',
      'Are you legally authorized to work in the United Kingdom?': 'professional.workAuthorization',
      'Will you now or in the future require sponsorship for employment visa status?':
        'professional.requiresSponsorship',
      'Why do you want to work here?': 'unmapped',
      School: 'education.institution',
      Degree: 'education.degree',
      Discipline: 'education.fieldOfStudy',
      'Start date year': 'education.startDate',
      'End date year': 'education.endDate',
      Gender: 'left for user',
      'Veteran Status': 'left for user',
      'I consent to the processing of my personal data': 'left for user',
    });
  });

  it('plans lazy react-select dropdowns as live-matched dropdown actions', () => {
    loadPage('greenhouse.html');
    const items = plan();
    expect(items['Country']!.action).toMatchObject({ kind: 'dropdown', search: 'United Kingdom' });
    expect(items['School']!.action).toMatchObject({
      kind: 'dropdown',
      search: 'University of London',
    });
    expect(
      items['Are you legally authorized to work in the United Kingdom?']!.action,
    ).toMatchObject({
      kind: 'dropdown',
      fallback: { kind: 'bool', value: true },
    });
    expect(items['Start date year']!.action).toEqual({ kind: 'text', text: '2014' });
    expect(
      items['Will you now or in the future require sponsorship for employment visa status?']!
        .preview,
    ).toBe('No');
  });
});

describe('Lever-style application', () => {
  it('reads labels from sibling divs and ✱ markers', () => {
    loadPage('lever.html');
    const items = plan();
    expect(summary(items)).toMatchObject({
      'ATTACH RESUME/CV': 'resume',
      'Full name': 'personal.fullName',
      Email: 'personal.email',
      Phone: 'personal.phone',
      'Current location': 'personal.location',
      'Current company': 'professional.currentCompany',
      'LinkedIn URL': 'links.linkedin',
      'Twitter URL': 'links.x', // X / Twitter, not the candidate's website
      'GitHub URL': 'links.github',
      'Portfolio URL': 'links.portfolio',
      'Will you require visa sponsorship to work here?': 'professional.requiresSponsorship',
      'How many years of professional experience do you have?': 'professional.yearsOfExperience',
      'Additional information': 'unmapped',
      Gender: 'left for user',
      Race: 'left for user',
    });
    expect(items['Full name']).toMatchObject({ required: true, preview: 'Ada Lovelace' });
    expect(items['How many years of professional experience do you have?']!.preview).toBe('6-10');
  });
});

describe('Workday-style application', () => {
  it('step 1: automation ids, "Select One" dropdown buttons', () => {
    loadPage('workday.html', 'step-1');
    const items = plan();
    expect(summary(items)).toEqual({
      Country: 'personal.country',
      'Given Name(s)': 'personal.firstName',
      'Family Name': 'personal.lastName',
      'Address Line 1': 'personal.address',
      City: 'personal.city',
      'Postal Code': 'personal.postalCode',
      'Email Address': 'personal.email',
      'Phone Device Type': 'unmapped',
      'Phone Number': 'personal.phone',
      'How Did You Hear About Us?': 'unmapped',
    });
    expect(items['Country']).toMatchObject({ type: 'select', action: { kind: 'dropdown' } });
  });

  it('step 2: numbered experience / education sections give context', () => {
    loadPage('workday.html', 'step-2');
    const items = plan();
    expect(summary(items)).toEqual({
      'Job Title': 'experience.jobTitle',
      Company: 'experience.company',
      'I currently work here': 'experience.isCurrent',
      From: 'experience.startDate',
      'School or University': 'education.institution',
      Degree: 'education.degree',
      'Field of Study': 'education.fieldOfStudy',
      LinkedIn: 'links.linkedin',
    });
    expect(items['From']!.action).toEqual({ kind: 'text', text: '03/2020' });
  });

  it('treats a dropdown button that already shows a value as filled', () => {
    loadPage('workday.html', 'step-1');
    document.getElementById('input-1')!.textContent = 'United States of America';
    expect(plan()['Country']).toMatchObject({ status: 'skip', reason: 'Already filled' });
  });
});
