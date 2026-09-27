import type { FieldOption } from '@jobfill/types';
import { chooseOptions, type ProfileValue } from '@jobfill/field-mapper';
import { displayedValue, dropdownOptionElements } from '@/field-detection/custom-dropdown';
import { textOf } from '@/field-detection/dom-text';
import { cleanLabel } from '@/field-detection/normalize';
import { isRendered } from '@/field-detection/visibility';
import { setTextValue } from './fill-actions';

/**
 * Generic filling for custom dropdowns, driven only by the ARIA contract:
 * trigger (combobox / aria-haspopup) → popup [role=listbox] → [role=option].
 *
 * Safety: never presses Enter (it can submit a form) and never clicks a trigger
 * that is a submit button — those only get pointer/mouse-down events, which have
 * no default action.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function pointer(el: Element, type: string) {
  const init = { bubbles: true, cancelable: true, composed: true, button: 0 };
  el.dispatchEvent(
    type.startsWith('pointer')
      ? new PointerEvent(type, { ...init, pointerType: 'mouse', isPrimary: true })
      : new MouseEvent(type, init),
  );
}

/** A user-like press: pointer/mouse down+up, then click unless that could submit. */
function press(el: Element, { click = true } = {}) {
  pointer(el, 'pointerdown');
  pointer(el, 'mousedown');
  pointer(el, 'pointerup');
  pointer(el, 'mouseup');
  if (click && !isSubmitter(el)) (el as HTMLElement).click();
}

function isSubmitter(el: Element): boolean {
  if (el instanceof HTMLButtonElement) return el.type === 'submit' || el.type === 'reset';
  if (el instanceof HTMLInputElement) return ['submit', 'image', 'reset'].includes(el.type);
  return false;
}

function visibleListboxes(doc: Document): Element[] {
  return [...doc.querySelectorAll('[role="listbox"]')].filter((l) => isRendered(l));
}

/** Options for this dropdown: owned via aria-controls/owns, or a listbox that just appeared. */
function liveOptions(trigger: Element, before: Set<Element>): Element[] {
  const owned = dropdownOptionElements(trigger).filter((o) => isRendered(o));
  if (owned.length) return owned;
  const appeared = visibleListboxes(trigger.ownerDocument).filter((l) => !before.has(l));
  return appeared
    .flatMap((l) => [...l.querySelectorAll('[role="option"]')])
    .filter((o) => isRendered(o));
}

async function waitFor<T>(probe: () => T | null, timeoutMs = 1500): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = probe();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await sleep(50);
  }
}

export function optionFromElement(el: Element): FieldOption {
  const label = cleanLabel(el.getAttribute('aria-label') || textOf(el));
  return {
    value: el.getAttribute('data-value') ?? el.getAttribute('data-answer-value') ?? label,
    label,
    selected: el.getAttribute('aria-selected') === 'true',
  };
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function close(trigger: Element) {
  // Escape closes every ARIA popup and has no submit semantics.
  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }),
  );
}

/**
 * Pick the option matching `value` in a custom dropdown.
 * `preferred` = indices already chosen from options known at planning time.
 */
export async function fillDropdown(
  trigger: Element,
  value: ProfileValue | null,
  search: string,
  preferredLabel?: string,
): Promise<boolean> {
  const doc = trigger.ownerDocument;
  const before = new Set(visibleListboxes(doc));

  // Choose with the same matcher as native selects.
  const pick = (candidates: Element[]) => {
    const described = candidates.map(optionFromElement);
    let index = -1;
    if (preferredLabel)
      index = described.findIndex((o) => normalize(o.label) === normalize(preferredLabel));
    if (index < 0 && value) index = chooseOptions(described, value)?.indices[0] ?? -1;
    return index >= 0 ? { option: candidates[index]!, label: described[index]!.label } : null;
  };

  // 1. Use visible options if the one we want is there; otherwise open the dropdown.
  //    Combobox inputs also get the search text, so async/filtered lists narrow down.
  let choice = pick(liveOptions(trigger, before));
  if (!choice) {
    press(trigger, { click: trigger.localName !== 'input' });
    if (trigger instanceof HTMLInputElement && search) {
      trigger.focus();
      setTextValue(trigger, search, { blur: false }); // type to filter; stay focused
    }
    choice = await waitFor(() => pick(liveOptions(trigger, before)));
  }
  if (!choice) {
    close(trigger);
    return false;
  }

  // 2. Select like a user and verify.
  const { option, label } = choice;

  option.scrollIntoView?.({ block: 'nearest' });
  press(option);
  await sleep(50);
  const ok = await waitFor(
    () =>
      option.getAttribute('aria-selected') === 'true' ||
      normalize(displayedValue(trigger)).includes(normalize(label)) ||
      (trigger instanceof HTMLInputElement && normalize(trigger.value) === normalize(label))
        ? true
        : null,
    800,
  );
  if (visibleListboxes(doc).some((l) => !before.has(l))) close(trigger);
  return ok === true;
}
