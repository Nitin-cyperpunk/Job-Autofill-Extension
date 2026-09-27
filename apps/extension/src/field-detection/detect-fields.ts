import type { FieldDescriptor, FieldOption, FieldType, LabelSource } from '@jobfill/types';
import type { DetectedField } from '@/types';
import { CONTROL_SELECTOR, DATA_HINT_ATTRIBUTES, DEBUG_OVERLAY_TAG, LIMITS } from './constants';
import { displayedValue, dropdownOptionElements, isCustomDropdown } from './custom-dropdown';
import {
  describedByText,
  followingText,
  nearbyText,
  rawTextOf,
  referencedText,
  sectionHeading,
  textOf,
} from './dom-text';
import { fieldIdFor } from './field-ids';
import {
  cleanLabel,
  collapseWhitespace,
  labelMarksRequired,
  normalizeFieldType,
} from './normalize';
import { isChoiceVisible, isRendered } from './visibility';

export interface DetectOptions {
  /** Injected in tests (jsdom has no layout). Defaults to a real layout check. */
  isVisible?: (el: Element) => boolean;
  /** Called for every open shadow root visited (the watcher observes them). */
  onShadowRoot?: (root: ShadowRoot) => void;
}

/**
 * Find and describe every form field under `root`, including inside open shadow
 * roots. Read-only: never modifies, focuses or submits anything.
 *
 * Radios and multi-checkbox sets are reported as ONE field with options, since
 * that's how a question maps to the profile ("Willing to relocate? ○ Yes ○ No").
 */
export function detectFields(
  root: Document | Element = document,
  options: DetectOptions = {},
): DetectedField[] {
  const isVisible = options.isVisible ?? isRendered;
  const candidates = collectCandidates(root, options.onShadowRoot);
  const ownedPopups = new Set(
    candidates
      .filter((el) => el.getAttribute('role') === 'combobox' || el.hasAttribute('aria-haspopup'))
      .flatMap((el) => [el.getAttribute('aria-controls'), el.getAttribute('aria-owns')])
      .flatMap((ids) => (ids ?? '').split(' '))
      .filter(Boolean),
  );
  const consumed = new Set<Element>();
  const groups = new Map<
    string | Element,
    { type: FieldType; widget: 'native' | 'aria'; container: Element | null; members: Element[] }
  >();
  const ordered: Array<DetectedField | { groupKey: string | Element }> = [];

  for (const el of candidates) {
    if (consumed.has(el) || !isCandidateAllowed(el)) continue;
    const role = el.getAttribute('role');
    const native =
      el.localName === 'input' || el.localName === 'textarea' || el.localName === 'select';
    // Custom dropdowns (combobox inputs, listbox buttons) are selects, whatever their tag.
    const dropdown = isCustomDropdown(el);
    const type = dropdown
      ? 'select'
      : normalizeFieldType(el.localName, el.getAttribute('type'), native ? null : role, isEditable(el));
    if (!type) continue;
    if (native && (el as HTMLInputElement).disabled) continue;
    if (!native && el.getAttribute('aria-disabled') === 'true') continue;

    // ---- choices: collect into groups, emitted in document order of first member
    if (type === 'radio' || type === 'checkbox') {
      const key = groupKeyFor(el, type, native);
      let group = groups.get(key);
      if (!group) {
        group = { type, widget: native ? 'native' : 'aria', container: null, members: [] };
        groups.set(key, group);
        ordered.push({ groupKey: key });
      }
      group.members.push(el);
      consumed.add(el);
      continue;
    }

    // ---- a combobox wrapper around an input combobox: the input represents the field
    if (!native && role === 'combobox' && el.querySelector('input')) continue;
    // ---- a listbox owned by a combobox/trigger (often portal-rendered) is its popup, not a field
    if (!native && role === 'listbox' && (el.closest('[role="combobox"]') || ownedPopups.has(el.id))) continue;
    // ---- only the outermost editable region of a rich-text editor
    if (
      type === 'contenteditable' &&
      el.parentElement?.closest('[contenteditable]:not([contenteditable="false"])')
    )
      continue;

    const visible = type === 'file' ? isChoiceVisible(el, isVisible) : isVisible(el);
    if (!visible && type !== 'file') continue; // hidden steps and honeypots
    consumed.add(el);
    ordered.push({
      descriptor: describeSingle(el, type, native && !dropdown, visible),
      element: el,
      elements: [el],
      ...(type === 'select' && (!native || dropdown) ? { optionElements: dropdownOptionElements(el) } : {}),
    });
    if (ordered.length >= LIMITS.maxFields) break;
  }

  const fields: DetectedField[] = [];
  for (const entry of ordered) {
    if ('descriptor' in entry) {
      fields.push(entry);
      continue;
    }
    const group = groups.get(entry.groupKey)!;
    const visibleMembers = group.members.filter((m) => isChoiceVisible(m, isVisible));
    if (visibleMembers.length === 0) continue;
    fields.push(describeGroup(group.type, group.widget, visibleMembers));
  }
  return fields;
}

// ---------------------------------------------------------------------------

function collectCandidates(root: Document | Element, onShadowRoot?: (root: ShadowRoot) => void): Element[] {
  const out: Element[] = [];
  const visit = (scope: Document | Element | ShadowRoot) => {
    out.push(...scope.querySelectorAll(CONTROL_SELECTOR));
    // Open shadow roots (web-component based ATS forms). Closed ones are unreachable by design.
    const doc = scope instanceof Document ? scope : scope.ownerDocument;
    if (!doc) return;
    const walker = doc.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const shadow = (node as Element).shadowRoot;
      if (shadow && (node as Element).localName !== DEBUG_OVERLAY_TAG) {
        onShadowRoot?.(shadow);
        visit(shadow);
      }
    }
  };
  visit(root);
  return out;
}

function isCandidateAllowed(el: Element): boolean {
  if (el.closest(DEBUG_OVERLAY_TAG)) return false;
  // Decorative duplicates and inert regions (e.g. behind a modal) aren't answerable.
  return !el.closest('[aria-hidden="true"], [inert]');
}

function isEditable(el: Element): boolean {
  const value = el.getAttribute('contenteditable');
  return value !== null && value !== 'false';
}

function groupKeyFor(el: Element, type: FieldType, native: boolean): string | Element {
  if (native) {
    const name = el.getAttribute('name');
    const form = (el as HTMLInputElement).form;
    // Unnamed native choices stand alone. Named ones group per form (the browser's rule for radios).
    return name ? `${type}:${name}:${form ? fieldIdFor(form) : 'doc'}` : el;
  }
  return ariaChoiceContainer(el);
}

/**
 * The container holding one question's ARIA options. Explicit groups win; otherwise
 * the nearest ancestor holding sibling options — but never one spanning several
 * questions (Google Forms wraps the whole form in role="list").
 */
function ariaChoiceContainer(el: Element): Element {
  const role = el.getAttribute('role');
  const explicit = el.closest(
    role === 'radio'
      ? '[role="radiogroup"]'
      : '[role="group"], fieldset, [role="list"][aria-labelledby], [role="list"][aria-label]',
  );
  if (explicit) return explicit;
  const sameRole = `[role="${role}"]`;
  let node = el.parentElement;
  for (let i = 0; node && i < 6; i++, node = node.parentElement) {
    if (node.querySelectorAll(sameRole).length > 1) {
      const questions = node.querySelectorAll(
        '[role="heading"], h1, h2, h3, h4, h5, h6, legend',
      ).length;
      return questions > 1 ? (el.parentElement ?? el) : node;
    }
  }
  return el.parentElement ?? el;
}

// ---------------------------------------------------------------------------

interface ResolvedLabel {
  label: string;
  source: LabelSource;
  raw: string;
}

/** The label cascade, strongest signal first. */
function resolveLabel(el: Element, { group = false } = {}): ResolvedLabel {
  const byId = referencedText(el, 'aria-labelledby');
  if (byId.text) return { label: cleanLabel(byId.text), source: 'aria-labelledby', raw: byId.raw };

  const labels = (el as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    const text = Array.from(labels, (l) => textOf(l)).join(' ');
    if (collapseWhitespace(text)) {
      return {
        label: cleanLabel(text),
        source: 'label',
        raw: Array.from(labels, (l) => rawTextOf(l)).join(' '),
      };
    }
  }

  const aria = el.getAttribute('aria-label');
  if (aria?.trim()) return { label: cleanLabel(aria), source: 'aria-label', raw: aria };

  if (group) {
    const legend = el.localName === 'fieldset' ? el.querySelector(':scope > legend') : null;
    if (legend)
      return { label: cleanLabel(textOf(legend)), source: 'legend', raw: rawTextOf(legend) };
  }

  const near = nearbyText(el);
  if (near) return { label: near, source: 'nearby', raw: rawNearby(el) };

  const placeholder = el.getAttribute('placeholder') ?? el.getAttribute('aria-placeholder');
  if (placeholder?.trim())
    return { label: cleanLabel(placeholder), source: 'placeholder', raw: placeholder };

  const title = el.getAttribute('title');
  if (title?.trim()) return { label: cleanLabel(title), source: 'title', raw: title };

  return { label: '', source: 'none', raw: '' };
}

/** Raw nearby text is only needed for its "*" marker; one cheap sibling look is enough. */
function rawNearby(el: Element): string {
  let node: Element | null = el;
  for (let i = 0; node && i <= 2; i++, node = node.parentElement) {
    const prev = node.previousElementSibling;
    if (prev) return rawTextOf(prev);
  }
  return '';
}

function attr(el: Element, name: string): string {
  return (el.getAttribute(name) ?? '').trim();
}

function baseDescriptor(
  el: Element,
  type: FieldType,
  widget: 'native' | 'aria',
): Omit<
  FieldDescriptor,
  | 'label'
  | 'labelSource'
  | 'nearbyText'
  | 'options'
  | 'required'
  | 'multiple'
  | 'visible'
  | 'hasValue'
> {
  return {
    id: fieldIdFor(el),
    type,
    widget,
    tagName: el.localName,
    role: attr(el, 'role'),
    name: attr(el, 'name'),
    htmlId: el.id,
    placeholder: attr(el, 'placeholder') || attr(el, 'aria-placeholder'),
    ariaLabel: attr(el, 'aria-label'),
    autocomplete: attr(el, 'autocomplete'),
    dataHints: dataHints(el),
    description: describedByText(el),
    section: sectionHeading(el),
  };
}

function describeSingle(
  el: Element,
  type: FieldType,
  native: boolean,
  visible: boolean,
): FieldDescriptor {
  const { label, source, raw } = resolveLabel(el);
  const options = type === 'select' ? selectOptions(el, native) : [];
  const required =
    (native && (el as HTMLInputElement).required) ||
    el.getAttribute('aria-required') === 'true' ||
    labelMarksRequired(raw);
  return {
    ...baseDescriptor(el, type, native ? 'native' : 'aria'),
    label,
    labelSource: source,
    nearbyText: source === 'nearby' ? label : nearbyText(el),
    options,
    required,
    multiple: native
      ? (el as HTMLSelectElement).multiple === true
      : el.getAttribute('aria-multiselectable') === 'true',
    visible,
    hasValue: currentlyHasValue(el, type, native, options),
  };
}

/** Does the field already hold something the user (or the site) put there? */
function currentlyHasValue(
  el: Element,
  type: FieldType,
  native: boolean,
  options: FieldOption[],
): boolean {
  if (type === 'select') {
    // A pre-selected placeholder ("Select…", value "") doesn't count.
    if (options.some((o) => o.selected && o.value.trim() !== '')) return true;
    return native ? false : displayedValue(el) !== '';
  }
  if (type === 'file') return ((el as HTMLInputElement).files?.length ?? 0) > 0;
  if (native) return (el as HTMLInputElement).value.trim() !== '';
  return (el.textContent ?? '').trim() !== '';
}

function selectOptions(el: Element, native: boolean): FieldOption[] {
  if (native) {
    return Array.from((el as HTMLSelectElement).options)
      .slice(0, LIMITS.maxOptions)
      .map((o) => ({ value: o.value, label: cleanLabel(o.label || o.text), selected: o.selected }));
  }
  // ARIA listbox/combobox: options may live in a popup referenced by aria-controls/owns.
  const popups = [
    el,
    ...referencedElementsOf(el, 'aria-controls'),
    ...referencedElementsOf(el, 'aria-owns'),
  ];
  const seen = new Set<Element>();
  const opts: FieldOption[] = [];
  for (const scope of popups) {
    for (const o of scope.querySelectorAll('[role="option"]')) {
      if (seen.has(o) || opts.length >= LIMITS.maxOptions) continue;
      seen.add(o);
      const label = cleanLabel(o.getAttribute('aria-label') || textOf(o));
      opts.push({
        value: o.getAttribute('data-value') ?? label,
        label,
        selected: o.getAttribute('aria-selected') === 'true',
      });
    }
  }
  return opts;
}

function referencedElementsOf(el: Element, attribute: string): Element[] {
  const ids = attr(el, attribute).split(/\s+/).filter(Boolean);
  return ids
    .map((id) => el.ownerDocument.getElementById(id))
    .filter((x): x is HTMLElement => x !== null);
}

// ---------------------------------------------------------------------------

function describeGroup(
  type: FieldType,
  widget: 'native' | 'aria',
  members: Element[],
): DetectedField {
  const first = members[0]!;

  // A lone checkbox ("I agree to the terms") is its own field, labelled by itself.
  if (members.length === 1 && type === 'checkbox') return describeLoneChoice(first, widget);

  const container = groupContainer(members, widget);
  const { label, source, raw } = container
    ? resolveLabel(container, { group: true })
    : resolveLabel(first);
  const options = members.map((m) => choiceOption(m, widget));
  const required =
    members.some(
      (m) =>
        (m as HTMLInputElement).required === true || m.getAttribute('aria-required') === 'true',
    ) ||
    container?.getAttribute('aria-required') === 'true' ||
    labelMarksRequired(raw);

  const descriptor: FieldDescriptor = {
    ...baseDescriptor(first, type, widget),
    id: fieldIdFor(first),
    role: container ? attr(container, 'role') || attr(first, 'role') : attr(first, 'role'),
    htmlId: container?.id || first.id,
    ariaLabel: container ? attr(container, 'aria-label') : attr(first, 'aria-label'),
    label,
    labelSource: source,
    nearbyText: container ? nearbyText(container) : nearbyText(first),
    description: container
      ? describedByText(container) || describedByText(first)
      : describedByText(first),
    options,
    required,
    multiple: type === 'checkbox',
    visible: true,
    hasValue: options.some((o) => o.selected),
  };
  return { descriptor, element: container ?? first, elements: members };
}

function describeLoneChoice(el: Element, widget: 'native' | 'aria'): DetectedField {
  const own = resolveLabel(el);
  // "[x] I agree" — the text after a checkbox is its label more often than the text before.
  const label =
    own.source === 'nearby' || own.source === 'none' ? followingText(el) || own.label : own.label;
  const descriptor: FieldDescriptor = {
    ...baseDescriptor(el, 'checkbox', widget),
    label,
    labelSource: own.source === 'none' && label ? 'nearby' : own.source,
    nearbyText: nearbyText(el),
    options: [{ ...choiceOption(el, widget), label }],
    required:
      (el as HTMLInputElement).required === true ||
      el.getAttribute('aria-required') === 'true' ||
      labelMarksRequired(own.raw),
    multiple: false,
    visible: true,
    hasValue: choiceOption(el, widget).selected,
  };
  return { descriptor, element: el, elements: [el] };
}

/** The element that represents the whole question: fieldset / ARIA group / common ancestor. */
function groupContainer(members: Element[], widget: 'native' | 'aria'): Element | null {
  const first = members[0]!;
  if (widget === 'aria') return ariaChoiceContainer(first);
  const semantic = first.closest('fieldset, [role="radiogroup"], [role="group"]');
  if (semantic && members.every((m) => semantic.contains(m))) return semantic;
  return commonAncestor(members);
}

function commonAncestor(members: Element[]): Element | null {
  if (members.length < 2) return members[0]?.parentElement ?? null;
  let ancestor: Element | null = members[0]!.parentElement;
  while (ancestor && !members.every((m) => ancestor!.contains(m)))
    ancestor = ancestor.parentElement;
  return ancestor;
}

function choiceOption(el: Element, widget: 'native' | 'aria'): FieldOption {
  if (widget === 'native') {
    const input = el as HTMLInputElement;
    const labels = input.labels ? Array.from(input.labels, (l) => textOf(l)).join(' ') : '';
    const label =
      cleanLabel(labels) || cleanLabel(attr(el, 'aria-label')) || followingText(el) || input.value;
    return { value: input.value, label, selected: input.checked };
  }
  const label = cleanLabel(attr(el, 'aria-label') || textOf(el));
  return {
    value: el.getAttribute('data-value') ?? el.getAttribute('data-answer-value') ?? label,
    label,
    selected: el.getAttribute('aria-checked') === 'true',
  };
}

/** Naming hints from test ids / automation ids on the field and its nearest wrappers. */
function dataHints(el: Element): string {
  const hints: string[] = [];
  let node: Element | null = el;
  for (let depth = 0; node && depth < 3; depth++, node = node.parentElement) {
    // Wrappers only count while they hold just this field.
    if (depth > 0 && node.querySelectorAll(CONTROL_SELECTOR).length > 1) break;
    for (const name of DATA_HINT_ATTRIBUTES) {
      const value = node.getAttribute(name);
      if (value && !hints.includes(value)) hints.push(value);
    }
  }
  return hints.join(' ');
}
