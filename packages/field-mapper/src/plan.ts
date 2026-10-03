import type { FieldDescriptor, FieldKey, Profile } from '@jobfill/types';
import { EXPLICIT_ONLY } from './dictionary';
import { explainMatch, matchField, REVIEW_CONFIDENCE, type MatchResult } from './match';
import { normalizeText } from './normalize';
import {
  chooseOptions,
  countryInText,
  optionPolarity,
  sameCountry,
  type OptionChoice,
} from './options';
import { classifyQuestion, reviewReasonFor, type QuestionCategory } from './questions';
import { meaningfulTokens, pathSegments } from './taxonomy';
import {
  describeValue,
  formatAddress,
  isIndexedKey,
  listFor,
  MONTH_NAMES,
  nationalNumber,
  permanentAddress,
  resolveProfileValue,
  type ProfileValue,
} from './values';

/**
 * Turns detected fields + the profile into a fill plan. Pure and deterministic:
 * the popup previews exactly what the content script will do.
 *
 *   detected field → match (dictionary + context) → value (profile only) → action
 *   → status (fill / fill-review / review / skip) with a human reason.
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
  /** What kind of question this is (Motivation, Salary, Project…). */
  category: QuestionCategory;
  /**
   * The field already had a value. JobFill leaves it alone; `action` holds what it would
   * enter, used only if the user explicitly chooses "Replace with JobFill value".
   */
  replaceable?: boolean;
  /** For list keys: which education / experience / project entry the value came from. */
  entryIndex?: number;
  /** For keys that can only be answered from an explicit profile answer. */
  explicitOnly?: boolean;
  /** Field type JobFill can't safely fill (rich-text editors…). */
  unsupported?: boolean;
}

/** Legal questions: always double-checked even when the mapping is certain. */
const ALWAYS_REVIEW = new Set<FieldKey>([
  'professional.workAuthorization',
  'professional.authorizedToWork',
  'professional.requiresSponsorship',
  'additional.criminalRecord',
]);

/** Prose answers drafted from the user's own profile text: filled, but worth a read. */
const DRAFT_KEYS = new Set<FieldKey>([
  'project.summary',
  'professional.reasonForLeaving',
  'additional.coverLetter',
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

const CURRENT_ADDRESS_PARTS = new Set<FieldKey>([
  'personal.city',
  'personal.state',
  'personal.postalCode',
  'personal.addressLine2',
  'personal.district',
]);
const PERMANENT_ADDRESS_PARTS = new Set<FieldKey>([
  'permanent.city',
  'permanent.state',
  'permanent.postalCode',
  'permanent.addressLine2',
  'permanent.district',
]);

/** What the rest of the page looks like — changes how some fields are best filled. */
interface PageContext {
  /** Separate City / PIN… fields exist, so "Address" means line 1, not the full address. */
  hasCurrentParts: boolean;
  hasPermanentParts: boolean;
  /** A separate country-code field exists, so the phone field gets the national number. */
  hasCountryCode: boolean;
}

export function displayLabel(field: FieldDescriptor): string {
  return field.label || field.placeholder || field.ariaLabel || field.name || 'Unlabelled field';
}

export function planFill(fields: FieldDescriptor[], profile: Profile): PlanItem[] {
  const matches = fields.map((f) => matchField(f));
  const keys = new Set(matches.flatMap((m) => (m.kind === 'match' ? [m.key] : [])));
  const page: PageContext = {
    hasCurrentParts: [...CURRENT_ADDRESS_PARTS].some((k) => keys.has(k)),
    hasPermanentParts: [...PERMANENT_ADDRESS_PARTS].some((k) => keys.has(k)),
    hasCountryCode: keys.has('personal.phoneCountryCode'),
  };
  const occurrences = new Map<FieldKey, number>();
  return fields.map((field, i) => planOne(field, matches[i]!, profile, occurrences, page));
}

/**
 * Notes for the summary: when the profile holds more education / experience / project
 * entries than the form has sections, say so instead of silently dropping them.
 */
export function planNotes(items: PlanItem[], profile: Profile): string[] {
  const sections: Record<'education' | 'experience' | 'projects', number> = {
    education: 0,
    experience: 0,
    projects: 0,
  };
  const perKey = new Map<FieldKey, number>();
  for (const item of items) {
    if (!item.key || !isIndexedKey(item.key) || item.key === 'project.summary') continue;
    perKey.set(item.key, (perKey.get(item.key) ?? 0) + 1);
  }
  for (const [key, count] of perKey) {
    const list = listFor(key);
    if (list) sections[list] = Math.max(sections[list], count);
  }
  const labels = { education: 'education', experience: 'jobs', projects: 'projects' } as const;
  const notes: string[] = [];
  for (const list of ['education', 'experience', 'projects'] as const) {
    const extra = profile[list].length - sections[list];
    if (sections[list] > 0 && extra > 0) {
      notes.push(
        `More data available: your profile has ${extra} more ${labels[list]} than this form shows. If the form has an “Add” button for more, add a section and run Autofill again.`,
      );
    }
  }
  return notes;
}

function fieldText(field: FieldDescriptor): string {
  return [field.label, field.ariaLabel, field.placeholder, field.description, field.nearbyText]
    .filter(Boolean)
    .join(' ');
}

/**
 * For "Describe one project where you used React": the project whose technologies,
 * name or description share the most meaningful words with the question. Falls back to
 * the Nth project (repeated sections) when nothing in the question points at one.
 */
export function pickProject(profile: Profile, question: string, fallback: number): number {
  const wanted = meaningfulTokens(question);
  if (wanted.size === 0) return fallback;
  let best = { index: fallback, score: 0 };
  profile.projects.forEach((project, index) => {
    const tech = new Set(project.technologies.flatMap((t) => [...meaningfulTokens(t)]));
    const words = meaningfulTokens(`${project.name} ${project.role} ${project.description}`);
    let score = 0;
    for (const w of wanted) {
      if (tech.has(w)) score += 3;
      else if (words.has(w)) score += 1;
    }
    if (score > best.score) best = { index, score };
  });
  return best.index;
}

function planOne(
  field: FieldDescriptor,
  match: MatchResult,
  profile: Profile,
  occurrences: Map<FieldKey, number>,
  page: PageContext,
): PlanItem {
  const question = fieldText(field);
  const base = {
    fieldId: field.id,
    label: displayLabel(field),
    type: field.type,
    required: field.required,
    key: null as FieldKey | null,
    confidence: 0,
    action: null as FillAction | null,
    preview: '',
    why: explainMatch(field, match),
    openEnded: false,
    category: classifyQuestion(`${field.label} ${field.description}`),
  };
  const leave = (reason: string, key: FieldKey | null = null): PlanItem => ({
    ...base,
    key,
    status: field.required ? 'review' : 'skip',
    reason,
  });

  if (match.kind === 'sensitive') {
    // Consent / agreements: always surfaced, never ticked. Protected data: left alone.
    if (match.reason === 'consent')
      return { ...base, status: 'review', reason: 'Consent or agreement — confirm it yourself' };
    return leave('Protected question — JobFill never answers this');
  }
  if (match.kind === 'none') {
    base.openEnded = !field.hasValue && isOpenEndedQuestion(field);
    if (base.openEnded) return leave(reviewReasonFor(base.category));
    if (base.category === 'COMPLIANCE' || base.category === 'WORK_AUTHORIZATION') {
      return { ...base, status: 'review', reason: reviewReasonFor(base.category) };
    }
    return leave('No matching profile field');
  }

  const { key, confidence } = match;
  const explicitOnly = EXPLICIT_ONLY.has(key);
  // Occurrence counting keeps repeated sections in order (2nd "School" → 2nd school).
  let index = occurrences.get(key) ?? 0;
  if (isIndexedKey(key)) occurrences.set(key, index + 1);
  if (key === 'project.summary') index = pickProject(profile, question, index);

  const value = valueFor(field, key, index, profile, page, question);
  const withKey = {
    ...base,
    key,
    confidence,
    ...(isIndexedKey(key) ? { entryIndex: index } : {}),
    ...(explicitOnly ? { explicitOnly } : {}),
  };

  if (value === null || 'missing' in value) {
    if (field.hasValue) return { ...withKey, status: 'skip', reason: 'Already filled' };
    const why = value && 'missing' in value ? value.missing : null;
    if (key === 'coverLetterFile')
      return {
        ...withKey,
        status: 'review',
        reason: 'Cover letter upload — attach the file yourself',
      };
    // A prose box the profile can't answer ("Cover letter", "Why are you leaving?" with
    // nothing saved): the user's own words are needed — the place AI help is offered.
    if (!explicitOnly && isOpenEndedQuestion(field)) {
      return {
        ...withKey,
        openEnded: true,
        status: field.required ? 'review' : 'skip',
        reason: reviewReasonFor(base.category),
      };
    }
    if (explicitOnly) {
      // Never guessed: always shown to the user, even on optional fields.
      return {
        ...withKey,
        status: 'review',
        reason: why ?? 'Not in your profile — JobFill never guesses this. Answer it yourself',
      };
    }
    return {
      ...leave(why ?? 'Not in your profile yet', key),
      ...withKey,
      status: field.required ? 'review' : 'skip',
    };
  }

  const action = actionFor(field, key, value);

  // The user already typed something: leave it. Keep the action so they can choose
  // "Replace with JobFill value" in the preview — never applied automatically.
  if (field.hasValue) {
    return {
      ...withKey,
      status: 'skip',
      reason: 'Already filled — left as entered',
      ...('problem' in action
        ? {}
        : { action: action.action, preview: action.preview, replaceable: true }),
    };
  }

  if ('problem' in action) {
    // We know the answer but can't enter it (custom widget, no matching option…):
    // always tell the user, even for optional fields, and show them the value.
    return {
      ...withKey,
      status: 'review',
      preview: describeValue(value),
      reason: action.problem,
      ...(action.unsupported ? { unsupported: true } : {}),
    };
  }

  const review =
    confidence < REVIEW_CONFIDENCE ||
    action.confidence < 0.8 ||
    ALWAYS_REVIEW.has(key) ||
    DRAFT_KEYS.has(key);
  return {
    ...withKey,
    action: action.action,
    preview: action.preview,
    status: review ? 'fill-review' : 'fill',
    reason: review ? reviewReason(key, confidence, action.confidence) : '',
  };
}

type Resolved = ProfileValue | { missing: string } | null;

/** The value for this field: the profile value, adjusted to what the page needs. */
function valueFor(
  field: FieldDescriptor,
  key: FieldKey,
  index: number,
  profile: Profile,
  page: PageContext,
  question: string,
): Resolved {
  switch (key) {
    case 'professional.authorizedToWork':
      return authorizedToWork(profile, question);
    case 'personal.age': {
      // "Are you at least 18 years of age?" — a yes/no derived from the user's own DOB.
      const threshold =
        /\b(?:at least|over|above|older than|minimum of)\s+(\d{2})\b|\b(\d{2})\s*(?:\+|years? (?:of age )?or (?:older|above|more))/i.exec(
          question,
        );
      const value = resolveProfileValue(profile, key, index);
      if (
        threshold &&
        (field.type === 'radio' || field.type === 'select' || field.type === 'checkbox')
      ) {
        if (!value || value.kind !== 'number') return null;
        return { kind: 'bool', value: value.value >= Number(threshold[1] ?? threshold[2]) };
      }
      return value;
    }
    case 'personal.phone': {
      const phone = profile.personal.phone.trim();
      if (!phone) return null;
      return { kind: 'text', text: page.hasCountryCode ? nationalNumber(phone) : phone };
    }
    case 'personal.address':
      // One "Address" box and no City / PIN fields: give the whole address.
      if (!page.hasCurrentParts || field.type === 'textarea') {
        const p = profile.personal;
        const full = formatAddress({
          line1: p.address,
          line2: p.addressLine2,
          landmark: p.landmark,
          city: p.city,
          district: p.district,
          state: p.state,
          postalCode: p.postalCode,
          country: p.country,
        });
        return full ? { kind: 'text', text: full } : null;
      }
      break;
    case 'permanent.address':
      if (!page.hasPermanentParts || field.type === 'textarea') {
        const full = formatAddress(permanentAddress(profile));
        return full ? { kind: 'text', text: full } : null;
      }
      break;
    default:
      break;
  }
  const value = resolveProfileValue(profile, key, index);
  // "LinkedIn username" / "GitHub handle": the handle, not the whole URL.
  if (
    value?.kind === 'text' &&
    key.startsWith('links.') &&
    /\b(username|handle|user id)\b/i.test(question)
  ) {
    const handle = handleFromUrl(value.text);
    return handle ? { kind: 'text', text: handle } : value;
  }
  return value;
}

/** "https://github.com/ada" → "ada"; "linkedin.com/in/ada-l" → "ada-l". */
export function handleFromUrl(url: string): string {
  const parts = pathSegments(url);
  const handle = parts[0] === 'in' || parts[0] === 'u' ? parts[1] : parts[0];
  return (handle ?? '').replace(/^@/, '');
}

/**
 * "Are you legally authorized to work in India?" → Yes only when the user listed India
 * among the countries they're authorized in. Any other case is left for the user:
 * an unlisted country is NOT answered "No" — JobFill doesn't know that.
 */
function authorizedToWork(profile: Profile, question: string): Resolved {
  const countries = profile.professional.authorizedCountries;
  const asked = countryInText(question, countries);
  if (!asked) {
    return {
      missing: countries.length
        ? 'Work authorization — the question doesn’t name a country. Answer it yourself'
        : 'Work authorization — add the countries you can work in to your profile, or answer it yourself',
    };
  }
  if (countries.some((c) => sameCountry(c, asked))) return { kind: 'bool', value: true };
  return {
    missing: `Work authorization for ${titleCase(asked)} isn’t set in your profile — answer it yourself`,
  };
}

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function reviewReason(key: FieldKey, confidence: number, optionConfidence: number): string {
  if (ALWAYS_REVIEW.has(key)) return 'Legal question — confirm the answer';
  if (DRAFT_KEYS.has(key)) return 'Filled from your profile — read it through before submitting';
  if (confidence < REVIEW_CONFIDENCE) return 'Best guess from the page text — please check';
  if (optionConfidence < 0.8) return 'Closest option chosen — please check';
  return 'Please check';
}

type ActionResult =
  | { action: FillAction; preview: string; confidence: number }
  | { problem: string; unsupported?: boolean };

function actionFor(field: FieldDescriptor, key: FieldKey, value: ProfileValue): ActionResult {
  // ---- files
  if (field.type === 'file') {
    return value.kind === 'file'
      ? { action: { kind: 'file' }, preview: value.fileName, confidence: 1 }
      : { problem: 'File upload — attach it yourself', unsupported: true };
  }

  // ---- lone checkbox ("I currently work here", "Same as current address")
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
      if (value.kind === 'file' || value.kind === 'date')
        return { problem: 'Unsupported value for a dropdown' };
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
    // Yes/No question answered from a free-text status (e.g. work authorization "Citizen").
    if (!choice && value.kind === 'text' && key === 'professional.workAuthorization') {
      choice = chooseOptions(field.options, authorizedAnswer(value.text));
      confidence = 0.6;
    }
    if (!choice) return { problem: `No option matches “${describeValue(value)}”` };
    const labels = choice.indices.map((i) => field.options[i]?.label ?? '').join(', ');
    return { action: { kind: 'options', indices: choice.indices }, preview: labels, confidence };
  }

  // ---- dates in date / month inputs
  if (field.type === 'date' || field.type === 'month') {
    if (value.kind === 'date') {
      const text = field.type === 'month' ? value.date.slice(0, 7) : value.date;
      return { action: { kind: 'text', text }, preview: value.date, confidence: 1 };
    }
    if (value.kind !== 'month') return { problem: 'Not a date in your profile' };
    const text = field.type === 'month' ? value.month : `${value.month}-01`;
    return { action: { kind: 'text', text }, preview: value.month, confidence: 1 };
  }

  // ---- free text
  if (TEXT_INPUTS.has(field.type)) {
    if (field.type === 'contenteditable') {
      const text = textFor(value);
      return {
        problem: `Rich-text box — paste this yourself: ${text.slice(0, 60)}`,
        unsupported: true,
      };
    }
    const hint = `${field.placeholder} ${field.label} ${field.description}`;
    let text: string;
    if (value.kind === 'date' || value.kind === 'month') {
      const formatted = formatDateForField(value, hint, field);
      if ('problem' in formatted) return formatted;
      text = formatted.text;
    } else {
      text = textFor(value);
    }
    if (!text) return { problem: 'Nothing suitable to type here' };
    if (field.type === 'number' && value.kind !== 'number' && !/^\d+(\.\d+)?$/.test(text)) {
      return { problem: 'Field expects a number' };
    }
    return { action: { kind: 'text', text }, preview: text, confidence: 1 };
  }

  return { problem: 'Unsupported field type', unsupported: true };
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
    case 'date':
      return value.date;
    case 'file':
      return '';
  }
}

// ---- Dates in text boxes ------------------------------------------------------------------

/**
 * The date format a text box expects, read from its placeholder / label / help text
 * ("DD/MM/YYYY", "mm-dd-yyyy", "YYYY-MM-DD", "MM/YYYY"…). Null when not stated.
 */
export function dateFormatHint(text: string): string | null {
  const m =
    /\b(dd|d|mm|m|yyyy|yy)([./\- ])(dd|d|mm|m|mmm|yyyy|yy)(?:\2(dd|d|mm|m|yyyy|yy))?\b/i.exec(text);
  if (!m) return null;
  const parts = [m[1], m[3], m[4]].filter(Boolean).map((p) => p!.toUpperCase());
  // Must contain a year and a month; "dd mm" alone is too vague.
  if (!parts.some((p) => p.startsWith('Y')) || !parts.some((p) => p.startsWith('M'))) return null;
  return parts.join(m[2]!);
}

function formatDateForField(
  value: Extract<ProfileValue, { kind: 'date' } | { kind: 'month' }>,
  hint: string,
  field: FieldDescriptor,
): { text: string } | { problem: string } {
  const iso = value.kind === 'date' ? value.date : `${value.month}-01`;
  const [y, mo, d] = iso.split('-') as [string, string, string];
  const yearOnly =
    /\byear\b/.test(normalizeText(`${field.label} ${field.placeholder} ${field.name}`)) &&
    !/\bmonth\b/.test(normalizeText(`${field.label} ${field.placeholder}`));
  if (yearOnly) return { text: y };

  const format = dateFormatHint(hint);
  if (format) {
    return {
      text: format
        .split(/([./\- ])/)
        .map((part) => {
          switch (part) {
            case 'YYYY':
              return y;
            case 'YY':
              return y.slice(2);
            case 'MM':
              return mo;
            case 'M':
              return String(Number(mo));
            case 'MMM':
              return MONTH_NAMES[Number(mo) - 1]!.slice(0, 3);
            case 'DD':
              return d;
            case 'D':
              return String(Number(d));
            default:
              return part;
          }
        })
        .join(''),
    };
  }
  // Month precision (study / job dates): the long-standing MM/YYYY convention.
  if (value.kind === 'month') {
    return { text: `${mo}/${y}` };
  }
  // A full date with no stated format: DD/MM vs MM/DD would be a guess that could
  // silently corrupt the answer. Show the date and let the user type it.
  return {
    problem: `Date format isn’t shown on the form — enter ${iso} in the format it expects`,
  };
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
const ESSAY_START =
  /^(why|describe|tell|explain|share|please describe|please tell|in your own words|what (is|are|motivates|makes)|how (would|do) you)\b/i;
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
