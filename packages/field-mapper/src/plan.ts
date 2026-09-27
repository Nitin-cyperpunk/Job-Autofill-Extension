import type { FieldDescriptor, FieldKey, Profile } from '@jobfill/types';
import { explainMatch, matchField, REVIEW_CONFIDENCE } from './match';
import { normalizeText } from './normalize';
import { chooseOptions, optionPolarity, type OptionChoice } from './options';
import { describeValue, isIndexedKey, resolveProfileValue, type ProfileValue } from './values';

/**
 * Turns detected fields + the profile into a fill plan. Pure and deterministic:
 * the popup previews exactly what the content script will do.
 */

export type FillAction =
  | { kind: 'text'; text: string }
  | { kind: 'options'; indices: number[] } // select / radio / checkbox group
  | { kind: 'check'; checked: boolean } // lone checkbox
  | { kind: 'file' }
  /** Custom dropdown whose options may only exist once opened: match live options against `value`. */
  | { kind: 'dropdown'; value: ProfileValue; search: string; fallback?: ProfileValue };

/**
 * fill         – confident; will be filled.
 * fill-review  – will be filled, but the user should double-check it.
 * review       – not filled; needs the user (required, sensitive, no data, no option).
 * skip         – left alone (already filled, optional without data, unrelated).
 */
export type PlanStatus = 'fill' | 'fill-review' | 'review' | 'skip';

export interface PlanItem {
  fieldId: string;
  label: string;
  type: FieldDescriptor['type'];
  required: boolean;
  key: FieldKey | null;
  confidence: number;
  status: PlanStatus;
  action: FillAction | null;
  /** What will be entered, for display. */
  preview: string;
  /** Why an item needs review or was skipped. */
  reason: string;
  /** Why it was mapped (or not): "label \"Email\" matched \"email\"". For the debug view. */
  why: string;
  /**
   * An open-ended question the profile can't answer ("Why do you want to work here?")
   * and that is still empty — the only kind of field AI assistance is offered for.
   */
  openEnded: boolean;
}

/** Legal questions: always double-checked even when the mapping is certain. */
const ALWAYS_REVIEW = new Set<FieldKey>([
  'professional.workAuthorization',
  'professional.requiresSponsorship',
]);

const TEXT_INPUTS = new Set([
  'text',
  'email',
  'tel',
  'url',
  'number',
  'textarea',
  'contenteditable',
]);

export function displayLabel(field: FieldDescriptor): string {
  return field.label || field.placeholder || field.ariaLabel || field.name || 'Unlabelled field';
}

export function planFill(fields: FieldDescriptor[], profile: Profile): PlanItem[] {
  const occurrences = new Map<FieldKey, number>();
  return fields.map((field) => planOne(field, profile, occurrences));
}

function planOne(
  field: FieldDescriptor,
  profile: Profile,
  occurrences: Map<FieldKey, number>,
): PlanItem {
  const base = {
    fieldId: field.id,
    label: displayLabel(field),
    type: field.type,
    required: field.required,
    key: null as FieldKey | null,
    confidence: 0,
    action: null as FillAction | null,
    preview: '',
    why: '',
    openEnded: false,
  };
  const leave = (reason: string, key: FieldKey | null = null): PlanItem => ({
    ...base,
    key,
    status: field.required ? 'review' : 'skip',
    reason,
  });

  const match = matchField(field);
  base.why = explainMatch(field, match);
  if (match.kind === 'sensitive') {
    return leave(
      match.reason === 'consent'
        ? 'Consent or agreement — confirm it yourself'
        : 'Personal question — answer it yourself',
    );
  }
  if (match.kind === 'none') {
    base.openEnded = !field.hasValue && isOpenEndedQuestion(field);
    return leave(base.openEnded ? 'Open question — write it yourself or use AI' : 'No matching profile field');
  }

  const { key, confidence } = match;
  // Occurrence counting keeps repeated sections in order (2nd "School" → 2nd school).
  const index = occurrences.get(key) ?? 0;
  if (isIndexedKey(key)) occurrences.set(key, index + 1);

  if (field.hasValue) return { ...base, key, confidence, status: 'skip', reason: 'Already filled' };

  const value = resolveProfileValue(profile, key, index);
  if (!value) return leave('Not in your profile yet', key);

  const action = actionFor(field, key, value);
  if ('problem' in action) {
    // We know the answer but can't enter it (custom dropdown, no matching option…):
    // always tell the user, even for optional fields, and show them the value.
    return {
      ...base,
      key,
      confidence,
      status: 'review',
      preview: describeValue(value),
      reason: action.problem,
    };
  }

  const review =
    confidence < REVIEW_CONFIDENCE || action.confidence < 0.8 || ALWAYS_REVIEW.has(key);
  return {
    ...base,
    key,
    confidence,
    action: action.action,
    preview: action.preview,
    status: review ? 'fill-review' : 'fill',
    reason: review ? reviewReason(key, confidence, action.confidence) : '',
  };
}

function reviewReason(key: FieldKey, confidence: number, optionConfidence: number): string {
  if (ALWAYS_REVIEW.has(key)) return 'Legal question — confirm the answer';
  if (confidence < REVIEW_CONFIDENCE) return 'Best guess from the page text — please check';
  if (optionConfidence < 0.8) return 'Closest option chosen — please check';
  return 'Please check';
}

type ActionResult =
  { action: FillAction; preview: string; confidence: number } | { problem: string };

function actionFor(field: FieldDescriptor, key: FieldKey, value: ProfileValue): ActionResult {
  // ---- files
  if (field.type === 'file') {
    return value.kind === 'file'
      ? { action: { kind: 'file' }, preview: value.fileName, confidence: 1 }
      : { problem: 'Unsupported file field' };
  }

  // ---- lone checkbox ("I currently work here", "Willing to relocate")
  if (field.type === 'checkbox' && !field.multiple) {
    if (value.kind !== 'bool') return { problem: 'Couldn’t decide how to answer this checkbox' };
    return {
      action: { kind: 'check', checked: value.value },
      preview: value.value ? 'Checked' : 'Unchecked',
      confidence: 1,
    };
  }

  // ---- choices: select, radio group, checkbox group
  if (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') {
    // Custom dropdowns: options are often only rendered once opened (react-select,
    // Workday). Use known options when present; otherwise match live at fill time.
    if (field.widget === 'aria' && field.type === 'select' && field.options.length === 0) {
      if (value.kind === 'file') return { problem: 'Unsupported value for a dropdown' };
      const search = value.kind === 'list' ? (value.items[0] ?? '') : describeValue(value);
      // Work authorization is often a Yes/No dropdown: offer the derived answer as a fallback.
      const fallback =
        key === 'professional.workAuthorization' && value.kind === 'text'
          ? authorizedAnswer(value.text)
          : undefined;
      return {
        action: { kind: 'dropdown', value, search, ...(fallback ? { fallback } : {}) },
        preview: describeValue(value),
        confidence: 0.85,
      };
    }
    let choice: OptionChoice | null = chooseOptions(field.options, value, field.multiple);
    let confidence = choice?.confidence ?? 0;
    // Yes/No question answered from free text (e.g. work authorization status).
    if (!choice && value.kind === 'text' && key === 'professional.workAuthorization') {
      choice = chooseOptions(field.options, authorizedAnswer(value.text));
      confidence = 0.6;
    }
    if (!choice) return { problem: `No option matches “${describeValue(value)}”` };
    const labels = choice.indices.map((i) => field.options[i]?.label ?? '').join(', ');
    return { action: { kind: 'options', indices: choice.indices }, preview: labels, confidence };
  }

  // ---- dates in date/month inputs
  if (field.type === 'date' || field.type === 'month') {
    if (value.kind !== 'month') return { problem: 'Not a date in your profile' };
    const text = field.type === 'month' ? value.month : `${value.month}-01`;
    return { action: { kind: 'text', text }, preview: value.month, confidence: 1 };
  }

  // ---- free text
  if (TEXT_INPUTS.has(field.type)) {
    // "Graduation year" / "Start date year" want just the year, not MM/YYYY.
    const yearOnly =
      value.kind === 'month' &&
      /\byear\b/.test(normalizeText(`${field.label} ${field.placeholder} ${field.name}`)) &&
      !/\bmonth\b/.test(normalizeText(`${field.label} ${field.placeholder}`));
    const text = yearOnly ? value.month.slice(0, 4) : textFor(value);
    if (!text) return { problem: 'Nothing suitable to type here' };
    if (field.type === 'number' && value.kind !== 'number' && !/^\d+(\.\d+)?$/.test(text)) {
      return { problem: 'Field expects a number' };
    }
    if (field.type === 'contenteditable') {
      return { problem: 'Rich-text box — paste this yourself: ' + text.slice(0, 60) };
    }
    return { action: { kind: 'text', text }, preview: text, confidence: 1 };
  }

  return { problem: 'Unsupported field type' };
}

function textFor(value: ProfileValue): string {
  switch (value.kind) {
    case 'text':
    case 'number':
      return value.text;
    case 'bool':
      return value.value ? 'Yes' : 'No';
    case 'list':
      return value.items.join(', ');
    case 'month': {
      const [year, month] = value.month.split('-');
      return `${month}/${year}`;
    }
    case 'file':
      return '';
  }
}

/** Convenience for callers that just want "is this yes/no-shaped". */
export function isYesNoQuestion(field: FieldDescriptor): boolean {
  return field.options.length > 0 && field.options.every((o) => optionPolarity(o.label) !== null);
}

/** "Citizen" / "Work permit" → authorized (Yes); "Requires sponsorship" / "Not authorized" → No. */
function authorizedAnswer(status: string): ProfileValue {
  return { kind: 'bool', value: !/\b(requir|need|not|no)\w*/i.test(status) };
}

/** Prompts that ask for the applicant's own words. */
const ESSAY_START = /^(why|describe|tell|explain|share|please describe|please tell|in your own words)\b/i;
/** Short factual / yes-no prompts: not essays, even when phrased as questions. */
const FACTUAL_START =
  /^(how did you (hear|find)|where did you|which|when|are you|do you|did you|have you|will you|can you|is |were you|would you)/i;

/**
 * Free-text questions a person answers in their own words. Text areas and rich-text
 * boxes always qualify; single-line fields only when they clearly ask for prose.
 */
export function isOpenEndedQuestion(field: FieldDescriptor): boolean {
  const label = field.label.trim();
  if (!label) return false;
  if (field.type === 'textarea' || field.type === 'contenteditable') return true;
  if (field.type !== 'text' || FACTUAL_START.test(label)) return false;
  return ESSAY_START.test(label) || (label.endsWith('?') && label.length >= 30);
}
