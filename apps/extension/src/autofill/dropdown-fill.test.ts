// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
// The same widget implementations the test pages run in real Chrome.
import {
  installAriaListbox,
  installComboboxes,
  installListboxButtons,
} from '../../test-pages/widgets.js';
import { fillDropdown } from './dropdown-fill';

// jsdom has no layout: treat everything attached and not display:none as rendered.
vi.mock('@/field-detection/visibility', () => ({
  isRendered: (el: Element) =>
    el.isConnected && !el.closest('[hidden]') && (el as HTMLElement).style?.display !== 'none',
  isChoiceVisible: () => true,
}));

beforeAll(() => {
  // jsdom lacks PointerEvent; MouseEvent carries everything the widgets need.
  (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ??= MouseEvent;
});

const combobox = (id: string, options: string[], extra = '') => `
  <label id="${id}-label" for="${id}">${id}</label>
  <div class="select__control"><div class="select__value-container">
    <div class="select__placeholder">Select...</div>
    <input id="${id}" role="combobox" aria-autocomplete="list" aria-labelledby="${id}-label" ${extra}
      data-options='${JSON.stringify(options).replace(/'/g, '&apos;')}'>
  </div><input type="hidden"></div>`;

describe('react-select style combobox', () => {
  beforeEach(() => {
    document.body.innerHTML = `<form>${combobox('country', ['India', 'United Kingdom', 'United States'])}${combobox('degree', ["Bachelor's Degree", "Master's Degree"])}</form>`;
    installComboboxes(document);
  });

  const shown = (id: string) =>
    document.getElementById(id)!.closest('.select__control')!.querySelector('.select__single-value')
      ?.textContent;

  it('opens, filters by typing, clicks the option and verifies', async () => {
    const input = document.getElementById('country')!;
    const ok = await fillDropdown(
      input,
      { kind: 'text', text: 'United Kingdom' },
      'United Kingdom',
    );
    expect(ok).toBe(true);
    expect(shown('country')).toBe('United Kingdom');
    expect(document.querySelector('[role=listbox]')).toBeNull(); // menu closed
  });

  it('matches options semantically (M.Sc. → Master’s Degree)', async () => {
    const ok = await fillDropdown(
      document.getElementById('degree')!,
      { kind: 'text', text: 'M.Sc.' },
      '',
    );
    expect(ok).toBe(true);
    expect(shown('degree')).toBe("Master's Degree");
  });

  it('gives up cleanly when nothing matches', async () => {
    const ok = await fillDropdown(
      document.getElementById('country')!,
      { kind: 'text', text: 'Atlantis' },
      'Atlantis',
    );
    expect(ok).toBe(false);
    expect(shown('country')).toBeUndefined();
    expect(document.querySelector('[role=listbox]')).toBeNull();
  });
});

describe('async combobox (school search)', () => {
  it('waits for options that load after typing', async () => {
    document.body.innerHTML = combobox(
      'school',
      ['Cambridge University', 'University of London'],
      'data-async="true"',
    );
    installComboboxes(document);
    const ok = await fillDropdown(
      document.getElementById('school')!,
      { kind: 'text', text: 'University of London' },
      'University of London',
    );
    expect(ok).toBe(true);
  });
});

describe('listbox button (Workday style, portal popup without aria-controls)', () => {
  it('opens the popup and picks the option', async () => {
    document.body.innerHTML = `<form><button type="button" id="c" aria-haspopup="listbox" data-options='["India","United Kingdom"]'>Select One</button></form>`;
    installListboxButtons(document);
    const button = document.getElementById('c')!;
    expect(
      await fillDropdown(button, { kind: 'text', text: 'United Kingdom' }, 'United Kingdom'),
    ).toBe(true);
    expect(button.textContent).toBe('United Kingdom');
  });

  it('never clicks a trigger that would submit the form', async () => {
    // No type attribute inside a form = submit button. It opens on pointerdown (Radix-style).
    document.body.innerHTML = `<form><button id="t" aria-haspopup="listbox" data-open-on="pointerdown" data-options='["Mobile","Home"]'>Select One</button></form>`;
    installListboxButtons(document);
    let submitted = 0;
    document.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted++;
    });
    const button = document.getElementById('t')!;
    expect(await fillDropdown(button, { kind: 'text', text: 'Mobile' }, 'Mobile')).toBe(true);
    expect(button.textContent).toBe('Mobile');
    expect(submitted).toBe(0);
  });
});

describe('always-rendered ARIA listbox (Google Forms style)', () => {
  it('opens it when the wanted option is hidden, then selects', async () => {
    document.body.innerHTML = `
      <style>[data-gforms]:not(.open) [role=option][aria-selected=false]{display:none}</style>
      <div role="listbox" data-gforms>
        <div role="option" data-value="" aria-selected="true">Choose</div>
        <div role="option" data-value="India" aria-selected="false">India</div>
        <div role="option" data-value="Germany" aria-selected="false">Germany</div>
      </div>`;
    installAriaListbox(document);
    // jsdom doesn't apply the stylesheet to style.display, so hide closed options inline.
    const sync = () =>
      document.querySelectorAll<HTMLElement>('[role=option]').forEach((o) => {
        const open = o.parentElement!.classList.contains('open');
        o.style.display = open || o.getAttribute('aria-selected') === 'true' ? '' : 'none';
      });
    sync();
    new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true });
    const listbox = document.querySelector('[role=listbox]')!;
    expect(await fillDropdown(listbox, null, 'Germany', 'Germany')).toBe(true);
    expect(document.querySelector('[data-value=Germany]')!.getAttribute('aria-selected')).toBe(
      'true',
    );
  });
});
