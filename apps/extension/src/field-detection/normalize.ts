import type { FieldType } from '@jobfill/types';
import { LIMITS, SKIPPED_INPUT_TYPES } from './constants';

/**
 * Pure string helpers used by the detector. No DOM access, so they're trivially
 * unit-testable and safe to reuse from the field mapper later.
 */

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

export function collapseWhitespace(text: string | null | undefined): string {
  return (text ?? '').replace(ZERO_WIDTH, '').replace(/\s+/g, ' ').trim();
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Tidy a label for display and matching: collapse whitespace and drop required /
 * optional markers and trailing punctuation. "  First Name * : " → "First Name".
 */
export function cleanLabel(
  text: string | null | undefined,
  max: number = LIMITS.maxLabelLength,
): string {
  let label = collapseWhitespace(text);
  let previous;
  do {
    previous = label;
    label = label
      // "*" and Lever's "✱" required markers, plus trailing colons
      .replace(/^[*✱:\s]+/, '')
      .replace(/[*✱:\s]+$/, '')
      .replace(/\((required|optional)\)$/i, '')
      .replace(/\brequired question$/i, '')
      .trim();
  } while (label !== previous);
  return truncate(label, max);
}

/** Does raw label text mark the field as required ("Email *", "Email (required)")? */
export function labelMarksRequired(raw: string | null | undefined): boolean {
  const text = collapseWhitespace(raw);
  return (
    /[*✱]\s*:?$/.test(text) || /^[*✱]/.test(text) || /\(required\)|required question/i.test(text)
  );
}

/**
 * Map an element's tag / type / role to the normalized field type,
 * or null when it isn't a field we detect (buttons, passwords, hidden inputs…).
 */
export function normalizeFieldType(
  tagName: string,
  typeAttr: string | null,
  role: string | null,
  editable = false,
): FieldType | null {
  const tag = tagName.toLowerCase();
  if (tag === 'input') {
    const type = (typeAttr ?? '').trim().toLowerCase() || 'text';
    if (SKIPPED_INPUT_TYPES.has(type)) return null;
    switch (type) {
      case 'email':
      case 'tel':
      case 'url':
      case 'number':
      case 'date':
      case 'month':
      case 'time':
      case 'radio':
      case 'checkbox':
      case 'file':
        return type;
      case 'datetime-local':
        return 'datetime';
      case 'week':
        return 'date';
      default:
        return 'text'; // text, search and unknown types behave like text
    }
  }
  if (tag === 'textarea') return 'textarea';
  if (tag === 'select') return 'select';

  switch ((role ?? '').trim().toLowerCase()) {
    case 'radio':
      return 'radio';
    case 'checkbox':
    case 'switch':
      return 'checkbox';
    case 'listbox':
    case 'combobox':
      return 'select';
    case 'textbox':
      return 'contenteditable';
  }
  return editable ? 'contenteditable' : null;
}

/** Field types that hold free text and can later be typed into. */
export function isTextLike(type: FieldType): boolean {
  return (
    type === 'text' ||
    type === 'email' ||
    type === 'tel' ||
    type === 'url' ||
    type === 'number' ||
    type === 'textarea' ||
    type === 'contenteditable'
  );
}
