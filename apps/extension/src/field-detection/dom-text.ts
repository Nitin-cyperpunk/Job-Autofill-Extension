import { CONTROL_SELECTOR, LIMITS } from './constants';
import { cleanLabel, collapseWhitespace, truncate } from './normalize';

/**
 * Read-only DOM text lookups used to describe a field. Nothing here writes to
 * the page, and every walk is bounded (see LIMITS).
 */

/** Tags whose text never describes a neighbouring field. */
const NON_LABEL_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'select',
  'option',
  'textarea',
  'button',
]);

/** Visible-ish text of a subtree, skipping scripts, option lists and aria-hidden decorations. */
export function textOf(node: Node, max = 300): string {
  let out = '';
  const walk = (n: Node) => {
    if (out.length >= max) return;
    if (n.nodeType === Node.TEXT_NODE) {
      out += ` ${n.nodeValue ?? ''}`;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as Element;
    if (
      NON_LABEL_TAGS.has(el.localName) ||
      el.hasAttribute('hidden') ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return;
    }
    for (let child = el.firstChild; child; child = child.nextSibling) walk(child);
  };
  walk(node);
  return collapseWhitespace(out).slice(0, max);
}

/** Raw text including decorations (used to spot "*" required markers). */
export function rawTextOf(node: Node | null | undefined): string {
  return collapseWhitespace(node?.textContent).slice(0, 300);
}

function lookupRoot(el: Element): Document | ShadowRoot {
  const root = el.getRootNode();
  return root instanceof ShadowRoot || root instanceof Document ? root : el.ownerDocument;
}

/** Resolve an id-list attribute (aria-labelledby / aria-describedby) to elements. */
export function referencedElements(el: Element, attribute: string): Element[] {
  const ids = (el.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
  const root = lookupRoot(el);
  return ids
    .map((id) => root.getElementById(id) ?? el.ownerDocument.getElementById(id))
    .filter((x): x is HTMLElement => x !== null);
}

export function referencedText(el: Element, attribute: string): { text: string; raw: string } {
  const refs = referencedElements(el, attribute);
  return {
    text: refs
      .map((r) => textOf(r))
      .join(' ')
      .trim(),
    raw: refs.map((r) => rawTextOf(r)).join(' '),
  };
}

function containsControl(el: Element): boolean {
  return el.matches(CONTROL_SELECTOR) || el.querySelector(CONTROL_SELECTOR) !== null;
}

function isIgnorable(el: Element): boolean {
  return (
    NON_LABEL_TAGS.has(el.localName) ||
    el.hasAttribute('hidden') ||
    el.getAttribute('aria-hidden') === 'true'
  );
}

/**
 * Text that sits just before a field in the DOM — for layouts where the "label"
 * is a sibling <div>/<span>/<td> rather than a real <label>.
 *
 * Walks previous siblings, then climbs up to LIMITS.nearbyDepth ancestors. It stops
 * as soon as it meets another field, so one field's label is never given to the next.
 *
 *   <div><span>City</span><div><input c1> <input c2></div></div>
 *   c1 → "City"; c2 → "" (c1 sits between it and the text).
 */
export function nearbyText(el: Element, depth: number = LIMITS.nearbyDepth): string {
  let node: Node = el;
  for (let level = 0; level <= depth; level++) {
    for (let sib = node.previousSibling; sib; sib = sib.previousSibling) {
      if (sib.nodeType === Node.TEXT_NODE) {
        const text = collapseWhitespace(sib.nodeValue);
        if (text) return cleanLabel(lastChars(text), LIMITS.maxNearbyLength);
        continue;
      }
      if (sib.nodeType !== Node.ELEMENT_NODE) continue;
      const sibEl = sib as Element;
      if (isIgnorable(sibEl)) continue;
      if (containsControl(sibEl)) return ''; // text beyond here belongs to another field
      const text = textOf(sibEl);
      if (text) return cleanLabel(lastChars(text), LIMITS.maxNearbyLength);
    }
    // Safe to climb: any control *before* this field inside the parent was a previous
    // sibling at a lower level and already stopped the walk above.
    const parent: Element | null = node.parentElement;
    if (!parent || parent.localName === 'form' || parent.localName === 'body') break;
    node = parent;
  }
  return '';
}

/** A long paragraph before a field usually ends with the question; keep the end. */
function lastChars(text: string): string {
  const max = LIMITS.maxNearbyLength;
  return text.length <= max ? text : text.slice(text.length - max).replace(/^\S*\s/, '');
}

/** Text directly after an element — how checkbox/radio options are often labelled. */
export function followingText(el: Element): string {
  for (let sib = el.nextSibling; sib; sib = sib.nextSibling) {
    if (sib.nodeType === Node.TEXT_NODE) {
      const text = collapseWhitespace(sib.nodeValue);
      if (text) return cleanLabel(text);
      continue;
    }
    if (sib.nodeType !== Node.ELEMENT_NODE) continue;
    const sibEl = sib as Element;
    if (containsControl(sibEl)) return '';
    const text = textOf(sibEl);
    if (text) return cleanLabel(text);
  }
  return '';
}

const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6,[role="heading"],legend';

/**
 * The heading of the section a field lives in (e.g. "Education", "Work experience").
 * Prefers an enclosing fieldset's legend, then the nearest preceding heading.
 */
export function sectionHeading(el: Element): string {
  const fieldset = el.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend');
  if (legend) return cleanLabel(textOf(legend));

  let node: Element | null = el;
  for (let level = 0; node && level < LIMITS.sectionDepth; level++) {
    let sib = node.previousElementSibling;
    for (let i = 0; sib && i < LIMITS.siblingScan; i++, sib = sib.previousElementSibling) {
      const heading = sib.matches(HEADING_SELECTOR) ? sib : lastMatch(sib, HEADING_SELECTOR);
      if (heading) return cleanLabel(textOf(heading));
    }
    node = node.parentElement;
    if (node?.localName === 'body') break;
  }
  return '';
}

function lastMatch(root: Element, selector: string): Element | null {
  const all = root.querySelectorAll(selector);
  return all.length ? all[all.length - 1]! : null;
}

export function describedByText(el: Element): string {
  return truncate(referencedText(el, 'aria-describedby').text, 200);
}
