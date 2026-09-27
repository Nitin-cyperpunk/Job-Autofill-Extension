import { BackendProvider } from './providers/backend';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { AIError, type AIProvider, type AISettings, type ProviderId } from './types';

/**
 * The only place that knows which providers exist. Everything else works with the
 * AIProvider interface, so adding one (Anthropic, Mistral, a JobFill backend…) is
 * a new class plus an entry here.
 */
export const PROVIDERS: Record<ProviderId, { label: string; defaultModel: string; needsKey: boolean; needsUrl: boolean; available: boolean }> = {
  openai: { label: 'OpenAI', defaultModel: 'gpt-4o-mini', needsKey: true, needsUrl: false, available: true },
  gemini: { label: 'Google Gemini', defaultModel: 'gemini-1.5-flash', needsKey: true, needsUrl: false, available: true },
  'openai-compatible': { label: 'OpenAI-compatible endpoint', defaultModel: '', needsKey: false, needsUrl: true, available: true },
  // Designed in, not offered in the UI until a JobFill service exists.
  backend: { label: 'JobFill service', defaultModel: '', needsKey: true, needsUrl: true, available: false },
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  provider: 'openai',
  model: PROVIDERS.openai.defaultModel,
  baseUrl: '',
  apiKey: '',
};

export function createProvider(settings: AISettings, fetchImpl?: typeof fetch): AIProvider {
  if (!settings.enabled) throw new AIError('AI answers are turned off. Enable them in JobFill settings.', 'config');
  const meta = PROVIDERS[settings.provider];
  if (!meta) throw new AIError('Unknown AI provider.', 'config');
  if (meta.needsKey && !settings.apiKey) throw new AIError(`Add your ${meta.label} API key in JobFill settings.`, 'config');
  if (meta.needsUrl && !settings.baseUrl) throw new AIError('Add the endpoint URL in JobFill settings.', 'config');

  switch (settings.provider) {
    case 'openai':
      return new OpenAIProvider({ apiKey: settings.apiKey, model: settings.model, fetchImpl });
    case 'gemini':
      return new GeminiProvider({ apiKey: settings.apiKey, model: settings.model, fetchImpl });
    case 'openai-compatible':
      return new OpenAIProvider({
        id: 'openai-compatible',
        label: 'OpenAI-compatible endpoint',
        apiKey: settings.apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
        fetchImpl,
      });
    case 'backend':
      return new BackendProvider({ baseUrl: settings.baseUrl, token: settings.apiKey, fetchImpl });
  }
}

/** Where a configuration would send data — for the consent screen, without creating a provider. */
export function describeDestination(settings: AISettings): string {
  try {
    const provider = createProvider(settings);
    return `${provider.label} (${provider.destination})`;
  } catch {
    return PROVIDERS[settings.provider]?.label ?? 'AI provider';
  }
}
