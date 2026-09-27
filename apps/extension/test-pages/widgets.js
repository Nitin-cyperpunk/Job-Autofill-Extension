/**
 * Vanilla stand-ins for the custom dropdowns real application forms use, so the
 * generic filler can be tested without the real sites. Each follows the ARIA
 * contract and the quirks that matter for automation:
 *
 *  - installComboboxes: react-select (new Greenhouse, many React apps). Opens on
 *    mousedown, filters as you type, renders its listbox in a portal, loads
 *    options asynchronously when data-async is set, and closes + clears on blur.
 *  - installListboxButtons: Workday / Headless UI. A button opens a portal popup
 *    WITHOUT aria-controls; clicking an option sets the button text.
 *    With data-open-on="pointerdown" it opens on pointerdown (Radix-style).
 *  - installAriaListbox: Google Forms. The listbox and options are always in
 *    the DOM; options are only visible while open.
 *
 * Used by the test pages (loaded in real Chrome) and imported by jsdom tests.
 */

let uid = 0;
const text = (s) => s.toLowerCase();

export function installComboboxes(root = document) {
  for (const input of root.querySelectorAll('input[role="combobox"][data-options]')) {
    const all = JSON.parse(input.dataset.options);
    const control = input.closest('.select__control');
    const placeholder = control.querySelector('.select__placeholder');
    let menu = null;

    const render = (query) => {
      menu.replaceChildren();
      const matches = all.filter((o) => text(o).includes(text(query)));
      if (!matches.length) {
        menu.innerHTML = '<div class="select__no-options">No options</div>';
        return;
      }
      for (const label of matches) {
        const option = document.createElement('div');
        option.setAttribute('role', 'option');
        option.id = `opt-${++uid}`;
        option.textContent = label;
        option.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus, like react-select
        option.addEventListener('click', () => choose(label));
        menu.append(option);
      }
    };

    const open = () => {
      if (menu) return;
      menu = document.createElement('div');
      menu.setAttribute('role', 'listbox');
      menu.id = `${input.id}-listbox`;
      menu.className = 'select__menu';
      const rect = control.getBoundingClientRect();
      Object.assign(menu.style, {
        position: 'absolute',
        left: `${rect.left + scrollX}px`,
        top: `${rect.bottom + scrollY}px`,
        width: `${rect.width}px`,
      });
      document.body.append(menu); // portal
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-controls', menu.id);
      if (input.dataset.async) {
        menu.innerHTML = '<div class="select__loading">Loading…</div>';
        setTimeout(() => menu && render(input.value), 300);
      } else {
        render(input.value);
      }
    };

    const close = () => {
      menu?.remove();
      menu = null;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-controls');
      input.value = ''; // react-select clears the typed text on blur/close
    };

    const choose = (label) => {
      control.querySelector('.select__single-value')?.remove();
      placeholder.hidden = true;
      const value = document.createElement('div');
      value.className = 'select__single-value';
      value.textContent = label;
      input.before(value);
      control.querySelector('input[type=hidden]').value = label;
      close();
    };

    control.addEventListener('mousedown', () => {
      open();
      input.focus();
    });
    input.addEventListener('input', () => {
      open();
      if (input.dataset.async) {
        menu.innerHTML = '<div class="select__loading">Loading…</div>';
        clearTimeout(input._t);
        input._t = setTimeout(() => menu && render(input.value), 300);
      } else {
        render(input.value);
      }
    });
    input.addEventListener('focusout', close);
    input.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }
}

export function installListboxButtons(root = document) {
  for (const button of root.querySelectorAll('button[aria-haspopup="listbox"][data-options]')) {
    const options = JSON.parse(button.dataset.options);
    let popup = null;
    const close = () => {
      popup?.remove();
      popup = null;
      button.setAttribute('aria-expanded', 'false');
    };
    const open = () => {
      if (popup) return;
      popup = document.createElement('div');
      popup.dataset.automationWidget = 'wd-popup';
      const rect = button.getBoundingClientRect();
      Object.assign(popup.style, {
        position: 'absolute',
        left: `${rect.left + scrollX}px`,
        top: `${rect.bottom + scrollY}px`,
        background: '#fff',
        border: '1px solid #ccc',
      });
      const list = document.createElement('ul');
      list.setAttribute('role', 'listbox');
      for (const label of options) {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.automationId = 'promptOption';
        li.textContent = label;
        li.addEventListener('click', () => {
          button.textContent = label;
          close();
        });
        list.append(li);
      }
      popup.append(list);
      document.body.append(popup); // portal, no aria-controls
      button.setAttribute('aria-expanded', 'true');
    };
    button.addEventListener(
      button.dataset.openOn === 'pointerdown' ? 'pointerdown' : 'click',
      (e) => {
        if (button.dataset.openOn === 'pointerdown') e.preventDefault();
        popup ? close() : open();
      },
    );
    button.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }
}

export function installAriaListbox(root = document) {
  for (const listbox of root.querySelectorAll('[role="listbox"][data-gforms]')) {
    listbox.addEventListener('click', (e) => {
      const option = e.target.closest('[role="option"]');
      if (!listbox.classList.contains('open')) {
        listbox.classList.add('open');
        return;
      }
      if (option) {
        listbox
          .querySelectorAll('[role="option"]')
          .forEach((o) => o.setAttribute('aria-selected', String(o === option)));
        listbox.classList.remove('open');
      }
    });
    listbox.addEventListener(
      'keydown',
      (e) => e.key === 'Escape' && listbox.classList.remove('open'),
    );
  }
}

/** Every form on the test pages records a submit attempt here. */
export function trackSubmits(root = document) {
  for (const form of root.querySelectorAll('form')) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.__submitted = (window.__submitted ?? 0) + 1;
    });
  }
}
