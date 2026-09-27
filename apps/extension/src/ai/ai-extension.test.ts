// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { planFill } from '@jobfill/field-mapper';
import { detectFields } from '@/field-detection';
import { field, sampleProfile } from '../../../../packages/field-mapper/src/test-helpers';
import { extractJobContext } from './job-context';
import { insertAnswer } from './insert-answer';

const isVisible = () => true;

describe('extractJobContext', () => {
  it('reads the posting, not the application form', () => {
    document.head.innerHTML = '<meta property="og:site_name" content="Example Co">';
    document.body.innerHTML = `
      <h1>Senior Frontend Engineer</h1>
      <div class="job-description">${'We build React products and care about accessibility. '.repeat(12)}</div>
      <form><div class="description"><label>Why us?<textarea></textarea></label></div></form>`;
    const job = extractJobContext(document);
    expect(job.title).toBe('Senior Frontend Engineer');
    expect(job.company).toBe('Example Co');
    expect(job.description).toMatch(/^We build React products/);
    expect(job.description).not.toContain('Why us?');
  });

  it('returns only what it finds', () => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<form><input aria-label="Email"></form>';
    document.title = '';
    expect(extractJobContext(document)).toEqual({});
  });
});

describe('insertAnswer', () => {
  it('writes into an empty textarea with framework-safe events', () => {
    document.body.innerHTML =
      '<label for="q">Why do you want to work here?</label><textarea id="q"></textarea>';
    let inputs = 0;
    document.getElementById('q')!.addEventListener('input', () => inputs++);
    const [f] = detectFields(document, { isVisible });
    expect(insertAnswer(f!, 'Because I love accessible products.')).toEqual({ ok: true });
    expect((document.getElementById('q') as HTMLTextAreaElement).value).toBe(
      'Because I love accessible products.',
    );
    expect(inputs).toBe(1);
  });

  it('asks before replacing text the user already wrote', () => {
    document.body.innerHTML =
      '<label for="q">Why us?</label><textarea id="q">My own words</textarea>';
    const [f] = detectFields(document, { isVisible });
    expect(insertAnswer(f!, 'AI text')).toMatchObject({ ok: false, hasValue: true });
    expect((document.getElementById('q') as HTMLTextAreaElement).value).toBe('My own words');
    expect(insertAnswer(f!, 'AI text', { replace: true })).toEqual({ ok: true });
  });

  it('never submits the form', () => {
    document.body.innerHTML =
      '<form><label for="q">Why us?</label><textarea id="q"></textarea><button>Submit</button></form>';
    let submitted = false;
    document.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      submitted = true;
    });
    const [f] = detectFields(document, { isVisible });
    insertAnswer(f!, 'Answer.');
    expect(submitted).toBe(false);
  });
});

describe('open questions (where AI can be offered)', () => {
  const plan = (overrides: Parameters<typeof field>[0]) =>
    planFill([field(overrides)], sampleProfile())[0]!;

  it('flags unanswerable free-text questions', () => {
    expect(plan({ label: 'Why do you want to work here?', type: 'textarea' }).openEnded).toBe(true);
    expect(plan({ label: 'What excites you about this role?', type: 'text' }).openEnded).toBe(true);
    expect(plan({ label: 'Cover letter', type: 'contenteditable' }).openEnded).toBe(true);
  });

  it('never offers AI for mapped, filled, sensitive or consent fields', () => {
    expect(plan({ label: 'Email', type: 'email' }).openEnded).toBe(false);
    expect(plan({ label: 'Why us?', type: 'textarea', hasValue: true }).openEnded).toBe(false);
    expect(plan({ label: 'Describe your gender identity', type: 'textarea' }).openEnded).toBe(
      false,
    );
    expect(plan({ label: 'Reference number', type: 'text' }).openEnded).toBe(false);
  });
});
