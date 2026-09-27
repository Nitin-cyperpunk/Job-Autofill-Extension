import type { DetectedField } from '@/types';
import { CONTROL_SELECTOR, DEBUG_OVERLAY_TAG } from './constants';
import { detectFields, type DetectOptions } from './detect-fields';

export interface WatcherOptions extends Pick<DetectOptions, 'isVisible'> {
  /** Quiet period after the last relevant mutation before rescanning. */
  debounceMs?: number;
  /** Upper bound on how long a constantly-mutating page can postpone a rescan. */
  maxWaitMs?: number;
  /** Minimum gap between two scans, whatever the page does. */
  minIntervalMs?: number;
}

export interface WatcherStats {
  scans: number;
  mutationBatches: number;
  ignoredBatches: number;
  lastScanMs: number;
}

type Listener = (fields: DetectedField[]) => void;

/** Attributes that can change what a field is or whether it's shown. */
const FIELD_ATTRIBUTES = [
  'type',
  'name',
  'id',
  'placeholder',
  'required',
  'aria-required',
  'aria-label',
  'aria-labelledby',
  'disabled',
  'aria-disabled',
  'role',
  'contenteditable',
];
const VISIBILITY_ATTRIBUTES = ['style', 'class', 'hidden', 'aria-hidden', 'inert', 'open'];

const OBSERVE_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeOldValue: true,
  attributeFilter: [...FIELD_ATTRIBUTES, ...VISIBILITY_ATTRIBUTES],
};

/**
 * Keeps an up-to-date list of the page's fields as it changes (SPAs, multi-step
 * forms, "Add another" buttons).
 *
 * Why this can't loop or thrash:
 *  - Detection is read-only, so scanning never causes mutations of its own.
 *  - Mutations are filtered: only ones that add/remove/reveal a control count.
 *    Typing, text changes and style churn on the controls themselves are ignored.
 *  - Rescans are debounced, capped by maxWait, spaced by minInterval, and skipped
 *    while the tab is hidden.
 *  - Listeners only hear about scans whose result actually changed.
 */
export class FieldWatcher {
  private fields: DetectedField[] = [];
  private signature = '';
  private observer: MutationObserver | null = null;
  private observedRoots = new WeakSet<Node>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingSince: number | null = null;
  private lastScanAt = 0;
  private dirtyWhileHidden = false;
  private readonly listeners = new Set<Listener>();
  private readonly options: Required<Omit<WatcherOptions, 'isVisible'>> & DetectOptions;
  readonly stats: WatcherStats = { scans: 0, mutationBatches: 0, ignoredBatches: 0, lastScanMs: 0 };

  constructor(
    private readonly doc: Document = document,
    options: WatcherOptions = {},
  ) {
    this.options = { debounceMs: 250, maxWaitMs: 1500, minIntervalMs: 400, ...options };
  }

  start(): void {
    if (this.observer) return;
    this.observedRoots = new WeakSet();
    this.observer = new MutationObserver((records) => this.onMutations(records));
    this.observeRoot(this.doc.documentElement);
    this.scanNow(); // also starts observing any open shadow roots it finds
    this.doc.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  /**
   * A MutationObserver on the document doesn't see inside shadow roots, so every
   * open shadow root the detector walks into is observed too (once).
   */
  private observeRoot(root: Node): void {
    if (!this.observer || this.observedRoots.has(root)) return;
    this.observedRoots.add(root);
    this.observer.observe(root, OBSERVE_OPTIONS);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pendingSince = null;
    this.doc.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Latest detected fields (from the last scan). */
  getFields(): DetectedField[] {
    return this.fields;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Scan immediately (e.g. right before autofill) and notify if anything changed. */
  scanNow(): DetectedField[] {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pendingSince = null;

    const started = performance.now();
    const fields = detectFields(this.doc, {
      isVisible: this.options.isVisible,
      onShadowRoot: (root) => this.observeRoot(root),
    });
    this.stats.lastScanMs = Math.round((performance.now() - started) * 10) / 10;
    this.stats.scans++;
    this.lastScanAt = Date.now();

    const signature = signatureOf(fields);
    this.fields = fields;
    if (signature !== this.signature) {
      this.signature = signature;
      for (const listener of this.listeners) listener(fields);
    }
    return fields;
  }

  private onMutations(records: MutationRecord[]): void {
    this.stats.mutationBatches++;
    if (!isRelevantBatch(records)) {
      this.stats.ignoredBatches++;
      return;
    }
    this.schedule();
  }

  private schedule(): void {
    if (this.doc.visibilityState === 'hidden') {
      this.dirtyWhileHidden = true;
      return;
    }
    const now = Date.now();
    this.pendingSince ??= now;
    const untilMaxWait = this.pendingSince + this.options.maxWaitMs - now;
    const untilMinInterval = this.lastScanAt + this.options.minIntervalMs - now;
    const delay = Math.max(0, Math.min(this.options.debounceMs, untilMaxWait), untilMinInterval);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.scanNow(), delay);
  }

  private readonly onVisibilityChange = () => {
    if (this.doc.visibilityState === 'visible' && this.dirtyWhileHidden) {
      this.dirtyWhileHidden = false;
      this.schedule();
    }
  };
}

// ---------------------------------------------------------------------------

function isOurs(node: Node): boolean {
  return (
    node.nodeType === Node.ELEMENT_NODE && (node as Element).closest(DEBUG_OVERLAY_TAG) !== null
  );
}

function touchesFields(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE || isOurs(node)) return false;
  const el = node as Element;
  return (
    el.matches(CONTROL_SELECTOR) ||
    el.localName === 'label' ||
    el.querySelector(CONTROL_SELECTOR) !== null
  );
}

/** Exported for tests. */
/**
 * Judge attribute changes by their NET effect over the batch: React sets and then
 * removes the same attribute within one render (e.g. name="" → no name), which
 * produces two records that cancel out.
 */
export function isRelevantBatch(records: MutationRecord[]): boolean {
  const baseline = new Map<Node, Map<string, string | null>>();
  for (const r of records) {
    if (r.type !== 'attributes' || !r.attributeName) continue;
    let perTarget = baseline.get(r.target);
    if (!perTarget) baseline.set(r.target, (perTarget = new Map()));
    if (!perTarget.has(r.attributeName)) perTarget.set(r.attributeName, r.oldValue);
  }
  return records.some((r) =>
    isRelevantMutation(
      r,
      r.attributeName ? baseline.get(r.target)?.get(r.attributeName) : undefined,
    ),
  );
}

/** Exported for tests. `baselineOldValue` is the attribute's value before the batch. */
export function isRelevantMutation(
  record: MutationRecord,
  baselineOldValue: string | null | undefined = record.oldValue,
): boolean {
  if (isOurs(record.target)) return false;
  if (record.type === 'childList') {
    for (const node of record.addedNodes) if (touchesFields(node)) return true;
    for (const node of record.removedNodes) if (touchesFields(node)) return true;
    return false;
  }
  if (record.type !== 'attributes' || record.target.nodeType !== Node.ELEMENT_NODE) return false;

  const el = record.target as Element;
  const attribute = record.attributeName ?? '';
  // React re-sets name/type (and others) to the same value on every render;
  // those records carry no change and must not trigger rescans while typing.
  if (baselineOldValue === el.getAttribute(attribute)) return false;
  const isControl = el.matches(CONTROL_SELECTOR);
  if (FIELD_ATTRIBUTES.includes(attribute)) return isControl;
  // Visibility changes matter when they can show/hide fields: on a container of
  // controls, or hidden/aria-hidden on a control. Class/style churn on the control
  // itself (focus rings, validation colours while typing) is ignored.
  if (isControl)
    return attribute === 'hidden' || attribute === 'aria-hidden' || attribute === 'inert';
  return el.querySelector(CONTROL_SELECTOR) !== null;
}

function signatureOf(fields: DetectedField[]): string {
  return fields
    .map(({ descriptor: d }) =>
      [
        d.id,
        d.type,
        d.label,
        d.required ? 1 : 0,
        d.visible ? 1 : 0,
        d.options.length,
        d.nearbyText,
      ].join('\u0001'),
    )
    .join('\u0002');
}
