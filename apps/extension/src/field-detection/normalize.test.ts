import { describe, expect, it } from 'vitest';
import {
  cleanLabel,
  collapseWhitespace,
  isTextLike,
  labelMarksRequired,
  normalizeFieldType,
} from './normalize';

describe('cleanLabel', () => {
  it.each([
    ['  First Name * ', 'First Name'],
    ['Email:', 'Email'],
    ['* Phone', 'Phone'],
    ['Email address (required)', 'Email address'],
    ['LinkedIn (optional):', 'LinkedIn'],
    ['Full name Required question', 'Full name'],
    ['Why\n   us?​', 'Why us?'],
    ['', ''],
  ])('%j → %j', (input, expected) => {
    expect(cleanLabel(input)).toBe(expected);
  });

  it('truncates very long labels', () => {
    expect(cleanLabel('x'.repeat(500)).length).toBeLessThanOrEqual(150);
  });
});

describe('labelMarksRequired', () => {
  it.each([
    ['First name *', true],
    ['First name*:', true],
    ['* Email', true],
    ['Email (required)', true],
    ['Full name Required question', true],
    ['Salary expectations', false],
    ['Rate 5*5 grid', false],
  ])('%j → %s', (input, expected) => {
    expect(labelMarksRequired(input)).toBe(expected);
  });
});

describe('normalizeFieldType', () => {
  it.each([
    ['input', null, null, 'text'],
    ['input', 'TEXT', null, 'text'],
    ['input', 'search', null, 'text'],
    ['input', 'email', null, 'email'],
    ['input', 'datetime-local', null, 'datetime'],
    ['input', 'week', null, 'date'],
    ['input', 'radio', null, 'radio'],
    ['input', 'file', null, 'file'],
    ['textarea', null, null, 'textarea'],
    ['select', null, null, 'select'],
    ['div', null, 'radio', 'radio'],
    ['div', null, 'switch', 'checkbox'],
    ['div', null, 'listbox', 'select'],
    ['div', null, 'combobox', 'select'],
    ['div', null, 'textbox', 'contenteditable'],
  ])('%s[type=%s][role=%s] → %s', (tag, type, role, expected) => {
    expect(normalizeFieldType(tag, type, role)).toBe(expected);
  });

  it.each(['hidden', 'submit', 'button', 'reset', 'image', 'password', 'range', 'color'])(
    'skips input[type=%s]',
    (type) => {
      expect(normalizeFieldType('input', type, null)).toBeNull();
    },
  );

  it('treats contenteditable elements without a role as rich text', () => {
    expect(normalizeFieldType('div', null, null, true)).toBe('contenteditable');
    expect(normalizeFieldType('div', null, null, false)).toBeNull();
  });
});

describe('helpers', () => {
  it('collapses whitespace and zero-width characters', () => {
    expect(collapseWhitespace(' a \n\t b‍ ')).toBe('a b');
  });

  it('knows which types hold free text', () => {
    expect(isTextLike('email')).toBe(true);
    expect(isTextLike('contenteditable')).toBe(true);
    expect(isTextLike('select')).toBe(false);
    expect(isTextLike('file')).toBe(false);
  });
});
