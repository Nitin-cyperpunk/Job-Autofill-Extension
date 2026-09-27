/**
 * @jobfill/ai — optional AI-assisted answers. Provider-agnostic and privacy-first:
 * requests are built from user-approved context items only.
 */
export { AIError } from './types';
export type {
  AIProvider,
  AISettings,
  AnswerRequest,
  AnswerVariants,
  CandidateContext,
  JobContext,
  ProviderId,
} from './types';
export { LIMITS, NEVER_SENT_TO_AI, buildContextItems, buildRequest } from './context';
export type { ContextItem, ContextItemId, QuestionInput } from './context';
export { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
export { fitLength, parseVariants } from './parse';
export { DEFAULT_AI_SETTINGS, PROVIDERS, createProvider, describeDestination } from './registry';
export { OpenAIProvider } from './providers/openai';
export { GeminiProvider } from './providers/gemini';
export { BackendProvider } from './providers/backend';
