// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@jobfill/types';
import { sampleProfile } from '../../../../../packages/field-mapper/src/test-helpers';
import { SAMPLE_RESUME } from '../../../../../packages/resume/src/test-fixtures';

// In-memory storage standing in for chrome.storage.local.
let stored: Profile;
vi.mock('@/storage', () => ({
  loadProfile: async () => structuredClone(stored),
  onProfileChanged: () => () => undefined,
  updateProfile: async (mutate: (p: Profile) => Profile) =>
    (stored = mutate(structuredClone(stored))),
  saveResume: vi.fn(),
  loadResume: async () => null,
}));

const { ProfileProvider } = await import('@/profile/ProfileProvider');
const { ResumeImportFlow } = await import('./ResumeImportFlow');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;
let done = 0;

beforeEach(async () => {
  stored = sampleProfile();
  stored.professional.currentTitle = 'AI Engineer'; // conflicts with the résumé's "Staff Software Engineer"
  done = 0;
  container = document.createElement('div');
  document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(
        ProfileProvider,
        null,
        createElement(ResumeImportFlow, { onDone: () => done++, onCancel: () => undefined }),
      ),
    ),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
});

const button = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(text))!;

async function pasteResume() {
  await act(async () => button('Paste text instead').click());
  const textarea = container.querySelector('textarea')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(
      textarea,
      SAMPLE_RESUME,
    );
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => button('Read this text').click());
}

describe('résumé import review', () => {
  it('shows the local-privacy promise', () => {
    expect(container.textContent).toContain(
      'Your resume stays on this device unless you choose an AI/cloud feature.',
    );
  });

  it('shows conflicts as Existing vs Resume with Keep / Use buttons', async () => {
    await pasteResume();
    const conflict = container.querySelector('[aria-label="Current job title: choose a value"]')!;
    expect(conflict.textContent).toContain('Existing');
    expect(conflict.textContent).toContain('AI Engineer');
    expect(conflict.textContent).toContain('Staff Software Engineer');
    expect(conflict.textContent).toContain('Keep Existing');
    expect(conflict.textContent).toContain('Use Resume Value');
  });

  it('saves only approved changes and keeps existing values by default', async () => {
    await pasteResume();
    const before = stored.experience.length;
    await act(async () => button('Save').click());
    expect(done).toBe(0); // shows the "saved" screen first
    expect(stored.professional.currentTitle).toBe('AI Engineer'); // conflict defaulted to Keep Existing
    // Both résumé roles already exist (same company + start date): nothing is duplicated.
    expect(stored.experience.length).toBe(before);
    expect(stored.certifications.map((c) => c.name)).toContain('AWS Certified Solutions Architect');
    expect(stored.skills.technical).toContain('Rust');
    expect(container.textContent).toMatch(/Saved \d+ changes to your profile — on this device/);
  });

  it('uses the résumé value only when the user chooses it', async () => {
    await pasteResume();
    const conflict = container.querySelector('[aria-label="Current job title: choose a value"]')!;
    await act(async () =>
      [...conflict.querySelectorAll('button')]
        .find((b) => b.textContent === 'Use Resume Value')!
        .click(),
    );
    await act(async () => button('Save').click());
    expect(stored.professional.currentTitle).toBe('Staff Software Engineer');
  });

  it('lets the user untick things before saving', async () => {
    await pasteResume();
    await act(async () => button('Rust').click()); // skill chip toggles off
    await act(async () => button('Save').click());
    expect(stored.skills.technical).not.toContain('Rust');
  });
});
