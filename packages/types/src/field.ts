/**
 * A normalized, serializable description of one form field on a page.
 *
 * Produced by the extension's field-detection engine and consumed by the
 * field-mapping engine. It deliberately holds no DOM references, so it can be
 * logged, sent between extension contexts and unit-tested in isolation.
 * (The extension pairs each descriptor with its elements in `DetectedField`.)
 */

export const FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'url',
  'number',
  'date',
  'month',
  'time',
  'datetime',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'file',
  'contenteditable',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

/** Where `label` came from, strongest first. Useful for weighting in the mapper. */
export type LabelSource =
  | 'aria-labelledby'
  | 'label'
  | 'aria-label'
  | 'legend'
  | 'nearby'
  | 'placeholder'
  | 'title'
  | 'none';

export interface FieldOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface FieldDescriptor {
  /** Detector-assigned id, stable for as long as the element stays in the page. */
  id: string;
  type: FieldType;
  /** Native form control, or an ARIA widget (e.g. Google Forms' div[role="radio"]). */
  widget: 'native' | 'aria';
  /** Lowercase tag of the primary element, e.g. "input", "div". */
  tagName: string;
  /** Explicit ARIA role attribute, or "". */
  role: string;

  // Raw attribute signals — kept separately so the mapper can weigh them.
  name: string;
  htmlId: string;
  placeholder: string;
  ariaLabel: string;
  autocomplete: string;
  /** data-automation-id / data-testid / formcontrolname… of the field and its wrapper. */
  dataHints: string;

  /** Best human-readable label, cleaned (no trailing "*" or ":"). */
  label: string;
  labelSource: LabelSource;
  /** Text found near the field in the DOM (for visually separated labels). */
  nearbyText: string;
  /** Help text from aria-describedby. */
  description: string;
  /** Nearest enclosing fieldset legend / section heading, e.g. "Education". */
  section: string;

  /** Choices for select, radio groups, checkbox groups and listboxes. */
  options: FieldOption[];
  required: boolean;
  /** Select[multiple] or a checkbox group. */
  multiple: boolean;
  /** False for fields present but not rendered (only file inputs are reported while hidden). */
  visible: boolean;
  /** The field already has a value / selection / file — autofill never overwrites it. */
  hasValue: boolean;
}
