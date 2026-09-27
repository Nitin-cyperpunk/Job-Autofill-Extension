import { createElement as h, useId, useState } from 'react';

/**
 * A typical React form: controlled inputs, generated ids (useId), no name
 * attributes, a re-render on every keystroke, and a field that only mounts when
 * a checkbox is ticked. Used by the React test page and the jsdom unit test.
 */
function Field({ label, value, onChange, type = 'text', required = false }) {
  const id = useId();
  return h(
    'div',
    { className: 'field' },
    h(
      'label',
      { htmlFor: id },
      label,
      required ? h('span', { 'aria-hidden': 'true' }, ' *') : null,
    ),
    h('input', { id, type, value, required, onChange: (e) => onChange(e.target.value) }),
  );
}

export function App() {
  const [form, setForm] = useState({ first: '', last: '', email: '', referrer: '', level: '' });
  const [hasReferral, setHasReferral] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return h(
    'form',
    { onSubmit: (e) => e.preventDefault() },
    h('h2', null, 'Your details'),
    h(Field, { label: 'First name', value: form.first, onChange: set('first'), required: true }),
    h(Field, { label: 'Last name', value: form.last, onChange: set('last'), required: true }),
    h(Field, { label: 'Work email', type: 'email', value: form.email, onChange: set('email') }),
    h(
      'div',
      { className: 'field' },
      h('label', { htmlFor: 'level' }, 'Seniority'),
      h(
        'select',
        { id: 'level', value: form.level, onChange: (e) => set('level')(e.target.value) },
        h('option', { value: '' }, 'Choose…'),
        h('option', { value: 'mid' }, 'Mid-level'),
        h('option', { value: 'senior' }, 'Senior'),
      ),
    ),
    h(
      'label',
      { className: 'check' },
      h('input', {
        type: 'checkbox',
        checked: hasReferral,
        onChange: (e) => setHasReferral(e.target.checked),
      }),
      ' I was referred by an employee',
    ),
    hasReferral
      ? h(Field, { label: 'Referrer name', value: form.referrer, onChange: set('referrer') })
      : null,
    h('button', { type: 'submit' }, 'Submit'),
  );
}
