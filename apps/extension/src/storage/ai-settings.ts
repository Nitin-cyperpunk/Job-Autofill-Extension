import { DEFAULT_AI_SETTINGS, PROVIDERS, type AISettings, type ProviderId } from '@jobfill/ai';
import { STORAGE_KEYS } from '@jobfill/shared';
import { getItem, removeItem, setItem } from './local-storage';

/**
 * Optional AI settings, including the user's own API key (bring-your-own-key).
 *
 * The key lives only in this browser's extension storage. It is read by the
 * background worker when the user clicks "Generate Answer" — never by page
 * scripts or the content script — and "Delete all profile data" removes it.
 */
export async function loadAISettings(): Promise<AISettings> {
  const stored = (await getItem<Partial<AISettings>>(STORAGE_KEYS.ai)) ?? {};
  const provider: ProviderId = stored.provider && stored.provider in PROVIDERS ? stored.provider : DEFAULT_AI_SETTINGS.provider;
  return {
    enabled: stored.enabled === true,
    provider,
    model: typeof stored.model === 'string' && stored.model ? stored.model : PROVIDERS[provider].defaultModel,
    baseUrl: typeof stored.baseUrl === 'string' ? stored.baseUrl : '',
    apiKey: typeof stored.apiKey === 'string' ? stored.apiKey : '',
  };
}

export async function saveAISettings(patch: Partial<AISettings>): Promise<AISettings> {
  const next = { ...(await loadAISettings()), ...patch };
  await setItem(STORAGE_KEYS.ai, next);
  return next;
}

/** Forget the key and turn AI off. */
export async function clearAISettings(): Promise<void> {
  await removeItem(STORAGE_KEYS.ai);
}
