import { CONTROL_SELECTOR } from './constants';
import { textOf } from './dom-text';
import { collapseWhitespace } from './normalize';

/**
 * Generic support for custom dropdowns — the part of real application forms that
 * isn't a native <select>:
 *
 *  - ARIA listbox always in the DOM          (Google Forms)
 *  - <input role="combobox"> + popup listbox  (react-select: new Greenhouse, many React apps)
 *  - <button aria-haspopup="listbox">         (Workday, Headless UI, Radix Select)
 *
 * All of them expose the same accessibility contract (combobox / listbox / option),
 * which is what we rely on instead of per-site class names.
 */

export function isCustomDropdown(el: Element): boolean {
  const role = el.getAttribute('role');
  if (el.localName === 'input') {
    const autocomplete = el.getAttribute('aria-autocomplete');
    return (
      role === 'combobox' ||
      ((autocomplete === 'list' || autocomplete === 'both') && el.hasAttribute('aria-controls'))
    );
  }
  if (el.getAttribute('aria-haspopup') === 'listbox') return true;
  return role === 'combobox' || role === 'listbox';
}

function byIdList(el: Element, attribute: string): Element[] {
  const ids = (el.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
  const root = el.getRootNode() as Document | ShadowRoot;
  return ids
    .map((id) => root.getElementById?.(id) ?? el.ownerDocument.getElementById(id))
    .filter((x): x is HTMLElement => x !== null);
}

/** The popup(s) holding a dropdown's options, when they exist in the DOM. */
export function dropdownPopups(el: Element): Element[] {
  return [el, ...byIdList(el, 'aria-controls'), ...byIdList(el, 'aria-owns')];
}

export function dropdownOptionElements(el: Element): Element[] {
  const seen = new Set<Element>();
  for (const scope of dropdownPopups(el)) {
    for (const option of scope.querySelectorAll('[role="option"]')) seen.add(option);
  }
  return [...seen];
}

const PLACEHOLDER_TEXT =
  /^(select|choose|please select|pick|search|type to search|start typing|none selected|--|—)\b/i;

export function isPlaceholderText(text: string): boolean {
  const t = collapseWhitespace(text);
  return !t || PLACEHOLDER_TEXT.test(t) || /^[-—–.\s]*$/.test(t);
}

/**
 * The value a custom dropdown currently shows, or "" when it shows nothing or a
 * placeholder. For combobox inputs the selection is usually rendered next to the
 * input (react-select's "single value"), so we look in the smallest container
 * that holds only this control, ignoring labels and placeholder elements.
 */
export function displayedValue(el: Element): string {
  if (el.localName === 'input') {
    const typed = (el as HTMLInputElement).value.trim();
    if (typed) return typed;
    let container: Element | null = el.parentElement;
    for (let i = 0; container && i < 3; i++) {
      const parent: Element | null = container.parentElement;
      if (!parent || parent.querySelectorAll(CONTROL_SELECTOR).length > 1) break;
      container = parent;
    }
    if (!container) return '';
    const text = [...container.childNodes]
      .map((node) => (node instanceof Element && isDecoration(node) ? '' : textOf(node)))
      .join(' ');
    return isPlaceholderText(text) ? '' : collapseWhitespace(text);
  }
  // Read the children: textOf() skips <button> subtrees (button text is not a label
  // for other fields), but a dropdown button's own text IS its current value.
  const text = collapseWhitespace([...el.childNodes].map((node) => textOf(node)).join(' '));
  return isPlaceholderText(text) ? '' : text;
}

function isDecoration(el: Element): boolean {
  return (
    el.localName === 'label' ||
    /placeholder/i.test(el.className?.toString() ?? '') ||
    el.getAttribute('aria-hidden') === 'true'
  );
}
