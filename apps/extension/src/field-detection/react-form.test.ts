// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// The same component the React test page renders in real Chrome.
import { App } from '../../test-pages/react-form.js';
import { detectFields } from './detect-fields';
import { FieldWatcher } from './watcher';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const isVisible = () => true;

let root: Root;
let container: HTMLElement;

beforeEach(async () => {
  container = document.createElement('div');
  document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(App)));
});

afterEach(async () => {
  await act(async () => root.unmount());
});

const labels = () => detectFields(document, { isVisible }).map((f) => f.descriptor.label);

function typeInto(input: HTMLInputElement, value: string) {
  // How a user (or autofill) changes a React-controlled input.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('React form', () => {
  it('detects fields with useId ids and no name attributes', () => {
    const fields = detectFields(document, { isVisible }).map((f) => f.descriptor);
    expect(fields.map((d) => `${d.type}:${d.label}`)).toEqual([
      'text:First name',
      'text:Last name',
      'email:Work email',
      'select:Seniority',
      'checkbox:I was referred by an employee',
    ]);
    expect(fields[0]).toMatchObject({
      labelSource: 'label',
      required: true,
      name: '',
      section: 'Your details',
    });
  });

  it('picks up a conditionally rendered field and keeps existing ids', async () => {
    const before = detectFields(document, { isVisible }).map((f) => f.descriptor.id);
    const checkbox = container.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    await act(async () => checkbox.click());
    const after = detectFields(document, { isVisible });
    expect(labels()).toContain('Referrer name');
    expect(after.slice(0, 5).map((f) => f.descriptor.id)).toEqual(before);
  });

  it('re-renders while typing cause no watcher notifications', async () => {
    const watcher = new FieldWatcher(document, { isVisible, debounceMs: 0, minIntervalMs: 0 });
    let notifications = 0;
    watcher.start();
    watcher.subscribe(() => notifications++);

    const first = container.querySelector<HTMLInputElement>('input')!;
    for (const value of ['A', 'Ad', 'Ada', 'Ada ', 'Ada L']) {
      await act(async () => typeInto(first, value));
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(first.value).toBe('Ada L');
    expect(notifications).toBe(0);
    watcher.stop();
  });
});
