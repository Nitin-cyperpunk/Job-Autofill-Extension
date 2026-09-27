import type { DetectedField } from '@/types';
import { setTextValue } from '@/autofill/fill-actions';

/**
 * Put an AI answer the user chose into its field. Same framework-safe writes as
 * autofill; rich-text editors get the text through the editing pipeline
 * (insertText) so their internal state stays consistent. Never submits.
 */
export function insertAnswer(
  field: DetectedField,
  text: string,
  { replace = false } = {},
): { ok: true } | { ok: false; message: string; hasValue?: boolean } {
  const el = field.element;
  if (field.descriptor.hasValue && !replace) {
    return { ok: false, message: 'This field already has text.', hasValue: true };
  }

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return setTextValue(el, text)
      ? { ok: true }
      : { ok: false, message: 'The page didn’t accept the text.' };
  }

  if (field.descriptor.type === 'contenteditable' && el instanceof HTMLElement) {
    el.focus();
    const selection = el.ownerDocument.getSelection();
    if (selection) {
      const range = el.ownerDocument.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range); // replace the (empty or approved) contents
    }
    // execCommand is deprecated but still the only way to go through an editor's input pipeline.
    const inserted = el.ownerDocument.execCommand?.('insertText', false, text);
    if (!inserted) {
      el.textContent = text;
      el.dispatchEvent(
        new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }),
      );
    }
    return (el.textContent ?? '').includes(text.slice(0, 20))
      ? { ok: true }
      : { ok: false, message: 'The editor didn’t accept the text.' };
  }

  return { ok: false, message: 'This kind of field can’t take a written answer.' };
}
