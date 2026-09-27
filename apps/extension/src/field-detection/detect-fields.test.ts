// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { FieldDescriptor } from '@jobfill/types';
import { matchField } from '@jobfill/field-mapper';

const keyOf = (d: FieldDescriptor) => {
  const m = matchField(d);
  return m.kind === 'match' ? m.key : null;
};
import { detectFields } from './detect-fields';

/** Test pages double as fixtures: the same markup is exercised in real Chrome by the e2e run. */
function loadPage(name: string) {
  const html = readFileSync(resolve(process.cwd(), 'apps/extension/test-pages', name), 'utf8');
  document.documentElement.innerHTML = html
    .replace(/<!doctype[^>]*>/i, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
}

// jsdom has no layout engine, so visibility is simulated from the fixtures' CSS classes.
const isVisible = (el: Element) => !el.closest('.honeypot, .sr-only, .hidden');

function detect() {
  return detectFields(document, { isVisible });
}

function descriptors(): FieldDescriptor[] {
  return detect().map((f) => f.descriptor);
}

function find(label: string): FieldDescriptor {
  const field = descriptors().find((d) => d.label === label);
  if (!field)
    throw new Error(
      `No field labelled "${label}". Got: ${descriptors()
        .map((d) => d.label)
        .join(' | ')}`,
    );
  return field;
}

describe('simple HTML form', () => {
  beforeEach(() => loadPage('simple.html'));

  it('finds every real field, in document order', () => {
    expect(descriptors().map((d) => `${d.type}:${d.label}`)).toEqual([
      'text:First Name',
      'text:Last name',
      'email:Email',
      'tel:Phone number',
      'select:Country',
      'radio:Are you legally authorized to work here?',
      'checkbox:Preferred work arrangement',
      'file:Upload resume',
      'textarea:Cover letter',
      'contenteditable:Additional information',
      'checkbox:I agree to the privacy policy',
    ]);
  });

  it('produces the normalized descriptor shape', () => {
    expect(find('First Name')).toMatchObject({
      type: 'text',
      widget: 'native',
      tagName: 'input',
      label: 'First Name',
      labelSource: 'label',
      name: 'first_name',
      htmlId: 'first',
      placeholder: 'Enter first name',
      required: true,
      section: 'Personal details',
      visible: true,
    });
  });

  it('reads wrapping labels, autocomplete and aria-required', () => {
    expect(find('Last name')).toMatchObject({ autocomplete: 'family-name', required: true });
    expect(find('Email')).toMatchObject({ autocomplete: 'email', required: true });
  });

  it('falls back to the placeholder when there is no label', () => {
    expect(find('Phone number')).toMatchObject({ labelSource: 'placeholder', required: false });
  });

  it('collects select options', () => {
    expect(find('Country').options).toEqual([
      { value: '', label: 'Select…', selected: true },
      { value: 'IN', label: 'India', selected: false },
      { value: 'US', label: 'United States', selected: false },
    ]);
  });

  it('groups radios into one question labelled by the legend', () => {
    const field = detect().find((f) => f.descriptor.type === 'radio')!;
    expect(field.descriptor).toMatchObject({
      labelSource: 'legend',
      required: true, // "*" in the legend
      multiple: false,
      options: [
        { value: 'yes', label: 'Yes', selected: false },
        { value: 'no', label: 'No', selected: false },
      ],
    });
    expect(field.elements).toHaveLength(2);
    expect(field.element.localName).toBe('fieldset');
  });

  it('groups same-name checkboxes and keeps a lone checkbox separate', () => {
    expect(find('Preferred work arrangement')).toMatchObject({ multiple: true });
    expect(
      find('Preferred work arrangement').options.map((o) => `${o.label}:${o.selected}`),
    ).toEqual(['Remote:false', 'Hybrid:true', 'On-site:false']);
    expect(find('I agree to the privacy policy')).toMatchObject({
      multiple: false,
      required: true,
    });
  });

  it('keeps visually hidden file inputs whose label is visible', () => {
    expect(find('Upload resume')).toMatchObject({ type: 'file', visible: true });
  });

  it('skips hidden, password, submit, disabled and honeypot inputs', () => {
    const names = descriptors().map((d) => d.name);
    for (const skipped of ['csrf', 'password', 'website_url', 'disabled_field']) {
      expect(names).not.toContain(skipped);
    }
  });

  it('assigns stable ids across scans without touching the DOM', () => {
    const before = document.documentElement.outerHTML;
    const first = descriptors().map((d) => d.id);
    const second = descriptors().map((d) => d.id);
    expect(second).toEqual(first);
    expect(new Set(first).size).toBe(first.length);
    expect(document.documentElement.outerHTML).toBe(before);
  });

  it('hands descriptors to the field mapper', () => {
    expect(keyOf(find('First Name'))).toBe('personal.firstName');
    expect(keyOf(find('Last name'))).toBe('personal.lastName'); // via autocomplete
    expect(keyOf(find('Phone number'))).toBe('personal.phone');
    expect(keyOf(find('Country'))).toBe('personal.country'); // selects are mapped too
  });
});

describe('Google Forms–style markup', () => {
  beforeEach(() => loadPage('google-forms.html'));

  it('labels inputs from aria-labelledby headings', () => {
    expect(find('Full name')).toMatchObject({
      type: 'text',
      labelSource: 'aria-labelledby',
      required: true,
      description: 'As it appears on your passport',
      name: '',
    });
    expect(find('Email')).toMatchObject({ type: 'email', required: true });
    expect(find('Why do you want to join us?').type).toBe('textarea');
    expect(find('Earliest start date').type).toBe('date');
  });

  it('reads ARIA radio groups with their options and selection', () => {
    expect(find('Years of experience')).toMatchObject({
      type: 'radio',
      widget: 'aria',
      required: true,
      options: [
        { value: '0-2', label: '0-2', selected: false },
        { value: '3-5', label: '3-5', selected: true },
        { value: '6+', label: '6+', selected: false },
      ],
    });
  });

  it('groups ARIA checkboxes per question even without a group role', () => {
    const roles = find('Which roles interest you?');
    expect(roles).toMatchObject({ type: 'checkbox', widget: 'aria', multiple: true });
    expect(roles.options.map((o) => o.value)).toEqual(['Engineering', 'Design', 'Product']);
  });

  it('reads ARIA listboxes as selects', () => {
    const country = find('Country of residence');
    expect(country).toMatchObject({ type: 'select', widget: 'aria' });
    expect(country.options.map((o) => o.value)).toEqual(['', 'India', 'Germany']);
  });

  it('ignores role="button" and finds exactly the 7 questions', () => {
    expect(descriptors()).toHaveLength(7);
  });
});

describe('visually separated labels', () => {
  beforeEach(() => loadPage('separated-labels.html'));

  const byName = (name: string) => descriptors().find((d) => d.name === name || d.htmlId === name)!;

  it('uses sibling cells, table cells, loose text and spans', () => {
    expect(byName('field_101')).toMatchObject({
      label: 'First name',
      labelSource: 'nearby',
      required: true,
    });
    expect(byName('field_102')).toMatchObject({ label: 'Surname', labelSource: 'nearby' });
    expect(byName('q2')).toMatchObject({ label: 'Email address', labelSource: 'nearby' });
    expect(byName('x3')).toMatchObject({ label: 'Phone', labelSource: 'nearby' });
    expect(byName('a7')).toMatchObject({ label: 'LinkedIn profile URL', labelSource: 'nearby' });
  });

  it('never lends one field’s label to the next field', () => {
    expect(byName('c1').label).toBe('City');
    expect(byName('c2')).toMatchObject({
      label: 'State / Province',
      labelSource: 'placeholder',
      nearbyText: '',
    });
  });

  it('follows aria-labelledby to a distant heading', () => {
    expect(byName('z9')).toMatchObject({ label: 'Cumulative GPA', labelSource: 'aria-labelledby' });
  });

  it('labels a radio question from the preceding paragraph and options from trailing text', () => {
    const spons = byName('spons');
    expect(spons).toMatchObject({
      type: 'radio',
      label: 'Will you now or in the future require sponsorship?',
      required: true,
    });
    expect(spons.options.map((o) => o.label)).toEqual(['Yes', 'No']);
  });

  it('records the section heading', () => {
    expect(byName('edu_0_a')).toMatchObject({ label: 'School', section: 'Education' });
  });

  it('lets the mapper work without meaningful names', () => {
    expect(keyOf(byName('field_101'))).toBe('personal.firstName');
    expect(keyOf(byName('q2'))).toBe('personal.email');
    expect(keyOf(byName('a7'))).toBe('links.linkedin');
  });
});

describe('edge cases', () => {
  it('only reports the outermost contenteditable region', () => {
    document.body.innerHTML = `<div contenteditable="true" aria-label="Cover letter"><p contenteditable="true">x</p></div>`;
    expect(descriptors()).toHaveLength(1);
  });

  it('skips fields inside aria-hidden or inert regions', () => {
    document.body.innerHTML = `<div aria-hidden="true"><input aria-label="Ghost"></div><div inert><input aria-label="Inert"></div><input aria-label="Real">`;
    expect(descriptors().map((d) => d.label)).toEqual(['Real']);
  });

  it('finds fields inside open shadow roots', () => {
    document.body.innerHTML = '<x-field></x-field>';
    const shadow = document.querySelector('x-field')!.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<label for="s">Shadow email</label><input id="s" type="email">';
    expect(find('Shadow email').type).toBe('email');
  });

  it('ignores the debug overlay', () => {
    document.body.innerHTML =
      '<jobfill-debug><input aria-label="Overlay"></jobfill-debug><input aria-label="Real">';
    expect(descriptors().map((d) => d.label)).toEqual(['Real']);
  });

  it('caps option lists', () => {
    document.body.innerHTML = `<select aria-label="Big">${'<option>x</option>'.repeat(1000)}</select>`;
    expect(find('Big').options).toHaveLength(300);
  });
});
