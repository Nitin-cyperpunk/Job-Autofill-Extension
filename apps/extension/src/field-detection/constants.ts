/** Everything that can be (part of) a form field, native or ARIA. */
export const CONTROL_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="radiogroup"]',
  '[role="radio"]',
  '[role="checkbox"]',
  '[role="switch"]',
  // Custom dropdown triggers (Workday, Headless UI, Radix…)
  'button[aria-haspopup="listbox"]',
  '[role="button"][aria-haspopup="listbox"]',
].join(',');

/** Attributes frameworks and test tooling use to name fields; useful mapping hints. */
export const DATA_HINT_ATTRIBUTES = [
  'data-automation-id',
  'data-testid',
  'data-test-id',
  'data-test',
  'data-qa',
  'data-cy',
  'data-field',
  'data-field-name',
  'data-name',
  'formcontrolname',
  'ng-reflect-name',
];

/** Input types that are never candidate fields (passwords are skipped on purpose). */
export const SKIPPED_INPUT_TYPES = new Set([
  'hidden',
  'submit',
  'button',
  'reset',
  'image',
  'password',
  'range',
  'color',
]);

/** Tag of the dev-only debug overlay host. The detector and watcher ignore it. */
export const DEBUG_OVERLAY_TAG = 'jobfill-debug';

/** Safety limits so a pathological page can't make a scan expensive. */
export const LIMITS = {
  maxFields: 400,
  maxOptions: 300,
  maxLabelLength: 150,
  maxNearbyLength: 150,
  /** How many ancestors nearby-text and section lookups may climb. */
  nearbyDepth: 3,
  sectionDepth: 8,
  /** Siblings inspected per ancestor level when looking for headings. */
  siblingScan: 12,
} as const;
