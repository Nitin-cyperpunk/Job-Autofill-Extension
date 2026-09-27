// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectFields } from '@/field-detection';
import { sampleProfile } from '../../../../packages/field-mapper/src/test-helpers';
import { fillPage, planPage } from './run-autofill';

// The content script reads the profile from chrome.storage; tests use a fixed one.
vi.mock('@/storage', () => ({
  loadProfile: async () => sampleProfile(),
  loadResume: async () => null,
}));

function loadPage(name: string) {
  const html = readFileSync(resolve(process.cwd(), 'apps/extension/test-pages', name), 'utf8');
  document.documentElement.innerHTML = html
    .replace(/<!doctype[^>]*>/i, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
}

const isVisible = (el: Element) => !el.closest('.honeypot, .sr-only, .hidden');
const detect = () => detectFields(document, { isVisible });
const value = (selector: string) => document.querySelector<HTMLInputElement>(selector)!.value;

describe('fillPage on the simple form', () => {
  let submits = 0;

  beforeEach(() => {
    loadPage('simple.html');
    submits = 0;
    document.querySelector('form')!.addEventListener('submit', () => submits++);
  });

  it('fills mapped fields and reports a summary', async () => {
    const summary = await fillPage(detect());

    expect(value('#first')).toBe('Ada');
    expect(value('[name=last_name]')).toBe('Lovelace');
    expect(value('#email')).toBe('ada@example.com');
    expect(value('[name=phone]')).toBe('+44 20 7946 0000');
    expect(
      document.querySelector<HTMLInputElement>('input[name=authorized][value=yes]')!.checked,
    ).toBe(true);

    expect(summary.filled.map((f) => f.label)).toEqual([
      'First Name',
      'Last name',
      'Email',
      'Phone number',
    ]);
    expect(summary.filledCount).toBe(5); // + the authorization radio, flagged for review
    const review = Object.fromEntries(summary.review.map((r) => [r.label, r.reason]));
    expect(review['Are you legally authorized to work here?']).toMatch(/Legal question/);
    expect(review['Country']).toMatch(/No option matches/); // only India / US offered
    expect(review['I agree to the privacy policy']).toMatch(/Consent/);
    expect(review['Upload resume']).toMatch(/Couldn’t fill/); // no stored file in this test
  });

  it('never submits, never ticks consent boxes, never touches hidden fields', async () => {
    await fillPage(detect());
    expect(submits).toBe(0);
    expect(document.querySelector<HTMLInputElement>('[name=privacy]')!.checked).toBe(false);
    expect(value('[name=website_url]')).toBe(''); // honeypot
    expect(value('[name=csrf]')).toBe('abc');
  });

  it('leaves values the user already entered', async () => {
    document.querySelector<HTMLInputElement>('#first')!.value = 'Augusta';
    const summary = await fillPage(detect());
    expect(value('#first')).toBe('Augusta');
    expect(summary.filled.map((f) => f.label)).not.toContain('First Name');
  });

  it('fills only the fields approved in the preview (safe mode)', async () => {
    const plan = await planPage(detect());
    const email = plan.find((i) => i.label === 'Email')!;
    const summary = await fillPage(detect(), [email.fieldId]);
    expect(value('#email')).toBe('ada@example.com');
    expect(value('#first')).toBe('');
    expect(summary.filledCount).toBe(1);
  });

  it('planning alone changes nothing', async () => {
    const before = document.documentElement.outerHTML;
    const plan = await planPage(detect());
    expect(plan.length).toBeGreaterThan(5);
    expect(document.documentElement.outerHTML).toBe(before);
  });
});

describe('fillPage with visually separated labels', () => {
  it('fills fields whose only label is nearby text', async () => {
    loadPage('separated-labels.html');
    await fillPage(detect());
    expect(value('[name=field_101]')).toBe('Ada');
    expect(value('[name=field_102]')).toBe('Lovelace');
    expect(value('[name=q2]')).toBe('ada@example.com');
    expect(value('#a7')).toBe('https://linkedin.com/in/ada');
    expect(value('[name=edu_0_a]')).toBe('University of London');
    expect(value('[name=z9]')).toBe('3.9/4.0');
    expect(document.querySelector<HTMLInputElement>('input[name=spons][value="0"]')!.checked).toBe(
      true,
    );
  });
});
