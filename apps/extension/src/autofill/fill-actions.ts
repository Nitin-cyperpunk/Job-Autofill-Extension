/**
 * Low-level, framework-compatible DOM writes.
 *
 * React, Vue and Angular keep their own copy of a field's value. Assigning
 * `el.value = x` is invisible to React (its value tracker swallows it) and a
 * controlled input snaps back on the next render. The reliable recipe is:
 *   1. call the *native* prototype setter (bypasses framework instance overrides),
 *   2. dispatch `input` (React onChange, Vue v-model, Angular DefaultValueAccessor),
 *   3. dispatch `change` (native listeners, Vue .lazy, selects),
 *   4. dispatch focusout/blur (Formik/Angular "touched", on-blur validation).
 * Choices are toggled with a real click(), exactly as a user would.
 *
 * Every function verifies the result and returns false if the page rejected it.
 * Nothing here ever clicks a button, presses Enter or submits a form.
 */

function fire(el: Element, type: string, init: EventInit = {}) {
  const event =
    type === 'input'
      ? new InputEvent('input', {
          bubbles: true,
          composed: true,
          inputType: 'insertReplacementText',
          ...init,
        })
      : type === 'focus' || type === 'blur'
        ? new FocusEvent(type, init)
        : type === 'focusin' || type === 'focusout'
          ? new FocusEvent(type, { bubbles: true, composed: true, ...init })
          : new Event(type, { bubbles: true, composed: true, ...init });
  el.dispatchEvent(event);
}

function nativeSetter(el: Element): ((this: Element, value: string) => void) | undefined {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  return Object.getOwnPropertyDescriptor(proto, 'value')?.set as
    ((this: Element, value: string) => void) | undefined;
}

export function setTextValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  { blur = true }: { blur?: boolean } = {},
): boolean {
  if (el.disabled || el.readOnly) return false;
  fire(el, 'focus');
  fire(el, 'focusin');
  const setter = nativeSetter(el);
  if (setter) setter.call(el, text);
  else el.value = text;
  fire(el, 'input', { data: text } as InputEventInit);
  if (!blur) return el.value === text; // comboboxes: blurring would close the menu and clear the text
  fire(el, 'change');
  fire(el, 'focusout');
  fire(el, 'blur');
  return el.value === text;
}

export function selectOptions(select: HTMLSelectElement, indices: number[]): boolean {
  if (select.disabled) return false;
  const targets = indices
    .map((i) => select.options[i])
    .filter((o): o is HTMLOptionElement => Boolean(o));
  if (targets.length === 0) return false;
  fire(select, 'focus');
  if (select.multiple) {
    for (const option of targets) option.selected = true;
  } else {
    const setter = nativeSetter(select);
    if (setter) setter.call(select, targets[0]!.value);
    else select.value = targets[0]!.value;
  }
  fire(select, 'input');
  fire(select, 'change');
  fire(select, 'blur');
  return targets.every((o) => o.selected);
}

const NEVER_CLICK = new Set(['submit', 'button', 'image', 'reset']);

function isSafeToClick(el: Element): boolean {
  if (el instanceof HTMLInputElement) return el.type === 'radio' || el.type === 'checkbox';
  const role = el.getAttribute('role');
  return (
    (role === 'radio' || role === 'checkbox' || role === 'switch') &&
    !NEVER_CLICK.has(el.getAttribute('type') ?? '')
  );
}

export function isChecked(el: Element): boolean {
  return el instanceof HTMLInputElement ? el.checked : el.getAttribute('aria-checked') === 'true';
}

/** Tick (or untick) a radio / checkbox, native or ARIA, via a real click. */
export function setChecked(el: Element, checked: boolean): boolean {
  if (!isSafeToClick(el)) return false;
  if ((el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true')
    return false;
  if (isChecked(el) !== checked) (el as HTMLElement).click();
  return isChecked(el) === checked;
}

/** Put a file into an <input type="file"> the way a drag-and-drop would. */
export function attachFile(input: HTMLInputElement, file: File): boolean {
  if (input.type !== 'file' || input.disabled) return false;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  fire(input, 'input');
  fire(input, 'change');
  return input.files?.length === 1 && input.files[0]?.name === file.name;
}
