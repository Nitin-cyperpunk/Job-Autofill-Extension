// @vitest-environment jsdom
import { createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StoredResume } from '@jobfill/types';
import { detectFields } from '@/field-detection';
import { sampleProfile } from '../../../../packages/field-mapper/src/test-helpers';
import { attachResumeTo, fillPage } from './run-autofill';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

// jsdom has no DataTransfer and won't take a hand-made FileList: a minimal stand-in for
// the browser behaviour attachFile relies on (input.files = transfer.files).
class TestDataTransfer {
  private list: File[] = [];
  items = { add: (file: File) => void this.list.push(file) };
  get files() {
    return Object.assign([...this.list], { item: (i: number) => this.list[i] ?? null });
  }
}
const assignedFiles = new WeakMap<HTMLInputElement, unknown>();
(globalThis as { DataTransfer?: unknown }).DataTransfer = TestDataTransfer;
Object.defineProperty(HTMLInputElement.prototype, 'files', {
  configurable: true,
  get(this: HTMLInputElement) {
    return assignedFiles.get(this) ?? [];
  },
  set(this: HTMLInputElement, files: unknown) {
    assignedFiles.set(this, files);
  },
});

const stored: StoredResume = {
  fileName: 'ada-resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 4,
  uploadedAt: '2026-01-01T00:00:00.000Z',
  dataBase64: btoa('%PDF'),
};
let resume: StoredResume | null = stored;
vi.mock('@/storage', () => ({
  loadProfile: async () => sampleProfile(),
  loadResume: async () => resume,
}));

const detect = () => detectFields(document, { isVisible: () => true });
const val = (sel: string) => document.querySelector<HTMLInputElement>(sel)!.value;
const statusOf = (summary: Awaited<ReturnType<typeof fillPage>>, label: string) =>
  summary.outcomes?.find((o) => o.label === label);

afterEach(() => {
  resume = stored;
  document.body.innerHTML = '';
});

describe('links and résumé on a typical application form', () => {
  const FORM = `
    <form>
      <label for="n">Full Name</label><input id="n" type="text">
      <label for="e">Email Address</label><input id="e" type="email">
      <label for="l">Current Location</label><input id="l" type="text">
      <label for="li">LinkedIn Profile URL <span aria-hidden="true">*</span></label>
      <input id="li" type="url" required>
      <label for="gh">GitHub Profile URL</label><input id="gh" type="url">
      <label for="pf">Personal Website</label><input id="pf" type="url">
      <label for="tw">X / Twitter</label><input id="tw" type="text">
      <label for="rl">Resume Drive Link</label><input id="rl" type="url">
      <label for="cv">Resume Upload</label><input id="cv" type="file" accept=".pdf,.doc,.docx">
      <label for="why">Why should we hire you?</label><textarea id="why"></textarea>
    </form>`;

  it('writes every value into the DOM and reports each as Filled only after verifying it', async () => {
    document.body.innerHTML = FORM;
    const summary = await fillPage(detect, { settleMs: 0 });

    expect(val('#n')).toBe('Ada Lovelace');
    expect(val('#e')).toBe('ada@example.com');
    expect(val('#l')).toBe('London, Greater London, United Kingdom');
    expect(val('#li')).toBe('https://linkedin.com/in/ada');
    expect(val('#gh')).toBe('https://github.com/ada');
    expect(val('#pf')).toBe('https://ada.dev');
    expect(val('#tw')).toBe('https://x.com/ada');
    expect(val('#rl')).toBe('https://drive.google.com/file/d/ada-resume/view');
    expect(document.querySelector<HTMLInputElement>('#cv')!.files?.[0]?.name).toBe(
      'ada-resume.pdf',
    );

    for (const label of [
      'Full Name',
      'Email Address',
      'Current Location',
      'LinkedIn Profile URL',
      'GitHub Profile URL',
      'Personal Website',
      'X / Twitter',
      'Resume Drive Link',
      'Resume Upload',
    ]) {
      expect(statusOf(summary, label), label).toMatchObject({ status: 'filled' });
    }
    expect(statusOf(summary, 'LinkedIn Profile URL')!.key).toBe('links.linkedin');
    expect(statusOf(summary, 'Why should we hire you?')!.status).toBe('needs-review');
  });

  it('fills a LinkedIn field the site pre-filled with a URL prefix', async () => {
    document.body.innerHTML = `
      <label for="a">LinkedIn Profile URL</label><input id="a" type="url" value="https://">
      <label for="b">LinkedIn</label><input id="b" value="https://www.linkedin.com/in/">`;
    const summary = await fillPage(detect, { settleMs: 0 });
    expect(val('#a')).toBe('https://linkedin.com/in/ada');
    expect(val('#b')).toBe('https://linkedin.com/in/ada');
    expect(statusOf(summary, 'LinkedIn Profile URL')!.status).toBe('filled');
  });

  it('still leaves a real LinkedIn URL the user typed', async () => {
    document.body.innerHTML = `<label for="a">LinkedIn</label><input id="a" value="https://linkedin.com/in/someone">`;
    const summary = await fillPage(detect, { settleMs: 0 });
    expect(val('#a')).toBe('https://linkedin.com/in/someone');
    expect(statusOf(summary, 'LinkedIn')!.status).toBe('not-filled');
  });

  it('reports a field as Failed when the page clears the value, never as Filled', async () => {
    document.body.innerHTML = `<label for="a">LinkedIn Profile URL</label><input id="a">`;
    const input = document.querySelector<HTMLInputElement>('#a')!;
    input.addEventListener('blur', () => setTimeout(() => (input.value = ''), 10));
    const summary = await fillPage(detect, { settleMs: 0 });
    expect(statusOf(summary, 'LinkedIn Profile URL')!.status).toBe('failed');
    expect(summary.filled.map((f) => f.label)).not.toContain('LinkedIn Profile URL');
  });

  it('fills fields inserted after the first pass', async () => {
    document.body.innerHTML = `<label for="n">Full Name</label><input id="n">`;
    document.querySelector('#n')!.addEventListener('input', () => {
      if (document.querySelector('#li')) return;
      document.body.insertAdjacentHTML(
        'beforeend',
        `<label for="li">LinkedIn Profile URL</label><input id="li" type="url">`,
      );
    });
    const summary = await fillPage(detect, { settleMs: 0 });
    expect(val('#li')).toBe('https://linkedin.com/in/ada');
    expect(statusOf(summary, 'LinkedIn Profile URL')!.status).toBe('filled');
  });
});

describe('React-controlled link inputs', () => {
  let root: Root;
  afterEach(() => root?.unmount());

  function Controlled({ accept }: { accept: boolean }) {
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    return createElement(
      'form',
      null,
      createElement('label', { htmlFor: 'li' }, 'LinkedIn Profile URL'),
      createElement('input', {
        id: 'li',
        type: 'url',
        value: linkedin,
        // A form that rejects the change keeps its own state and re-renders empty.
        onChange: (e: { target: HTMLInputElement }) => accept && setLinkedin(e.target.value),
      }),
      createElement('label', { htmlFor: 'gh' }, 'GitHub URL'),
      createElement('input', {
        id: 'gh',
        value: github,
        onChange: (e: { target: HTMLInputElement }) => setGithub(e.target.value),
      }),
      createElement('output', { id: 'state' }, `${linkedin}|${github}`),
    );
  }

  async function render(accept: boolean) {
    const container = document.createElement('div');
    document.body.replaceChildren(container);
    root = createRoot(container);
    root.render(createElement(Controlled, { accept }));
    await new Promise((r) => setTimeout(r, 20));
  }

  it('updates React state, not just the DOM', async () => {
    await render(true);
    const summary = await fillPage(detect, { settleMs: 0 });
    await new Promise((r) => setTimeout(r, 20));
    expect(document.querySelector('#state')!.textContent).toBe(
      'https://linkedin.com/in/ada|https://github.com/ada',
    );
    expect(statusOf(summary, 'LinkedIn Profile URL')!.status).toBe('filled');
    expect(statusOf(summary, 'GitHub URL')!.status).toBe('filled');
  });

  it('reports Failed when a controlled input snaps back', async () => {
    await render(false);
    const summary = await fillPage(detect, { settleMs: 0 });
    expect(val('#li')).toBe('');
    expect(statusOf(summary, 'LinkedIn Profile URL')!.status).toBe('failed');
  });
});

describe('résumé upload fields', () => {
  it('without a saved file: needs review with "Attach Resume", never "Filled"', async () => {
    resume = null;
    document.body.innerHTML = `<p>Upload your resume</p><input id="cv" type="file" accept=".pdf,.doc,.docx">`;
    const summary = await fillPage(detect, { settleMs: 0 });
    const cv = summary.outcomes!.find((o) => o.key === 'resume')!;
    expect(cv).toMatchObject({ status: 'needs-review', resume: true });
    expect(cv.reason).toMatch(/Attach Resume/);
    expect(summary.filled).toHaveLength(0);
  });

  it('Attach Resume attaches the saved file and verifies it', async () => {
    document.body.innerHTML = `<label for="cv">Upload CV</label><input id="cv" type="file">`;
    const field = detect()[0]!;
    expect(await attachResumeTo(field)).toEqual({ ok: true });
    expect(document.querySelector<HTMLInputElement>('#cv')!.files?.[0]?.name).toBe(
      'ada-resume.pdf',
    );
  });

  it('Attach Resume reports failure when the site drops the file', async () => {
    document.body.innerHTML = `<label for="cv">Upload CV</label><input id="cv" type="file">`;
    const input = document.querySelector<HTMLInputElement>('#cv')!;
    // e.g. a validator that only allows its own uploader
    input.addEventListener('change', () =>
      setTimeout(() => (input.files = new TestDataTransfer().files as unknown as FileList), 10),
    );
    const res = await attachResumeTo(detect()[0]!);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/upload button/);
  });
});
