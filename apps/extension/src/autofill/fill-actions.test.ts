// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../test-pages/react-form.js';
import { selectOptions, setChecked, setTextValue } from './fill-actions';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('framework-compatible writes: React controlled form', () => {
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

  const input = (label: string) => {
    const l = [...container.querySelectorAll('label')].find((x) =>
      x.textContent?.startsWith(label),
    )!;
    return container.querySelector<HTMLInputElement>(`[id="${l.htmlFor}"]`)!;
  };

  /** Force React to re-render every field from its own state. */
  const rerender = async () => {
    const box = container.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    await act(async () => box.click());
    await act(async () => box.click());
  };

  it('updates React state, so values survive a re-render', async () => {
    await act(async () => {
      expect(setTextValue(input('First name'), 'Ada')).toBe(true);
      expect(setTextValue(input('Work email'), 'ada@example.com')).toBe(true);
    });
    await rerender();
    expect(input('First name').value).toBe('Ada');
    expect(input('Work email').value).toBe('ada@example.com');
  });

  it('shows why the naive approach fails (el.value = x is lost on re-render)', async () => {
    input('Last name').value = 'Lovelace';
    await rerender();
    expect(input('Last name').value).toBe('');
  });

  it('selects options React keeps', async () => {
    const select = container.querySelector('select')!;
    await act(async () => {
      expect(selectOptions(select, [2])).toBe(true);
    });
    await rerender();
    expect(select.value).toBe('senior');
  });

  it('ticks checkboxes with a real click that React handles', async () => {
    const box = container.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    await act(async () => {
      expect(setChecked(box, true)).toBe(true);
    });
    expect(container.textContent).toContain('Referrer name'); // React reacted to the change
  });
});

describe('framework-compatible writes: event contract', () => {
  it('fires focus → input → change → blur, and a model bound to "input" sees the value', () => {
    document.body.innerHTML = '<input id="x">';
    const el = document.getElementById('x') as HTMLInputElement;
    const events: string[] = [];
    let model = ''; // what Vue v-model / Angular's DefaultValueAccessor would hold
    for (const type of ['focus', 'focusin', 'input', 'change', 'focusout', 'blur']) {
      el.addEventListener(type, () => events.push(type));
    }
    el.addEventListener('input', () => (model = el.value));
    setTextValue(el, 'hello');
    expect(events).toEqual(['focus', 'focusin', 'input', 'change', 'focusout', 'blur']);
    expect(model).toBe('hello');
  });

  it('writes through instance-level value overrides with the native setter', () => {
    document.body.innerHTML = '<input id="x">';
    const el = document.getElementById('x') as HTMLInputElement;
    // Some libraries shadow `value` on the instance; the native setter still reaches the DOM.
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: () => 'shadow',
      set: () => undefined,
    });
    setTextValue(el, 'real');
    delete (el as { value?: string }).value;
    expect(el.value).toBe('real');
  });

  it('refuses read-only and disabled fields', () => {
    document.body.innerHTML = '<input id="a" readonly><input id="b" disabled>';
    expect(setTextValue(document.getElementById('a') as HTMLInputElement, 'x')).toBe(false);
    expect(setTextValue(document.getElementById('b') as HTMLInputElement, 'x')).toBe(false);
  });

  it('never clicks buttons, only radios and checkboxes', () => {
    document.body.innerHTML = `
      <form><button type="submit" id="go">Submit</button><div role="button" id="fake">Next</div></form>`;
    let submitted = false;
    let clicked = false;
    document.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = true;
    });
    document.getElementById('fake')!.addEventListener('click', () => (clicked = true));
    expect(setChecked(document.getElementById('go')!, true)).toBe(false);
    expect(setChecked(document.getElementById('fake')!, true)).toBe(false);
    expect(submitted).toBe(false);
    expect(clicked).toBe(false);
  });

  it('toggles ARIA radios through click', () => {
    document.body.innerHTML = '<div role="radio" aria-checked="false" id="r"></div>';
    const radio = document.getElementById('r')!;
    radio.addEventListener('click', () => radio.setAttribute('aria-checked', 'true'));
    expect(setChecked(radio, true)).toBe(true);
  });

  it('reports failure when the page ignores the click', () => {
    document.body.innerHTML = '<div role="checkbox" aria-checked="false" id="c"></div>';
    expect(setChecked(document.getElementById('c')!, true)).toBe(false);
  });
});
