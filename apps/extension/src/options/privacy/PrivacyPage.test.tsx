// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_SETTINGS, type AISettings } from '@jobfill/ai';
import { sampleProfile } from '../../../../../packages/field-mapper/src/test-helpers';

let ai: AISettings = { ...DEFAULT_AI_SETTINGS };
const clearAISettings = vi.fn(async () => {
  ai = { ...DEFAULT_AI_SETTINGS };
});

vi.mock('@/storage', () => ({
  loadProfile: async () => sampleProfile(),
  onProfileChanged: () => () => undefined,
  getBytesInUse: async (key: string | null = null) =>
    key === null ? 4096 : key === 'jobfill.ai.v1' && ai.apiKey ? 120 : 0,
}));
vi.mock('@/storage/ai-settings', () => ({
  loadAISettings: async () => ({ ...ai }),
  clearAISettings,
}));

const { ProfileProvider } = await import('@/profile/ProfileProvider');
const { PrivacyPage } = await import('./PrivacyPage');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

async function render() {
  container = document.createElement('div');
  document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(ProfileProvider, null, createElement(PrivacyPage, { navigate: () => {} })),
    ),
  );
}

const section = (name: string) => container.querySelector(`section[aria-label="${name}"]`)!;

afterEach(async () => {
  await act(async () => root.unmount());
  ai = { ...DEFAULT_AI_SETTINGS };
  clearAISettings.mockClear();
});

describe('PrivacyPage', () => {
  it('explains what stays, what may leave, why and to whom', async () => {
    await render();
    const text = container.textContent!;
    for (const heading of [
      'What stays on your device',
      'What may leave your device',
      'What is sent',
      'Why it is sent',
      'Who receives it',
      'Export profile',
      'Import profile',
      'AI history',
      'Delete all local data',
    ]) {
      expect(text).toContain(heading);
    }
    expect(text).toContain('doesn’t keep any AI history');
  });

  it('says nothing goes to AI while it is off', async () => {
    await render();
    const flow = section('AI answers').textContent!;
    expect(flow).toContain('Off');
    expect(flow).toContain('Nothing — AI answers are off.');
    expect(container.textContent).toContain('No AI settings are stored.');
  });

  it('names the provider and host when AI is on — without revealing the key', async () => {
    ai = { ...DEFAULT_AI_SETTINGS, enabled: true, apiKey: 'sk-secret-123' };
    await render();
    const flow = section('AI answers').textContent!;
    expect(flow).toContain('OpenAI (api.openai.com)');
    expect(flow).toContain('Never sent: your name, email, phone');
    expect(container.innerHTML).not.toContain('sk-secret-123');

    const forget = [...container.querySelectorAll('button')].find(
      (b) => b.textContent === 'Turn off AI and forget API key',
    )!;
    await act(async () => forget.click());
    expect(clearAISettings).toHaveBeenCalledOnce();
    expect(container.textContent).toContain('AI settings and API key removed.');
    expect(section('AI answers').textContent).toContain('Nothing — AI answers are off.');
  });
});
