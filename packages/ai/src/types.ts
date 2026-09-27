/**
 * Provider-agnostic types for AI-assisted answers.
 *
 * An AnswerRequest is EXACTLY what leaves the device (serialized into the prompt).
 * It is built only from the context items the user approved on the consent
 * screen — never from the whole profile.
 */

export interface JobContext {
  title?: string;
  company?: string;
  /** Job description text from the page (truncated). */
  description?: string;
}

export interface CandidateContext {
  currentRole?: string;
  yearsOfExperience?: string;
  skills?: string[];
  experience?: Array<{ title: string; company: string; period: string; highlights: string }>;
  education?: Array<{ degree: string; field: string; institution: string }>;
  summary?: string;
}

export interface AnswerRequest {
  /** The question as shown on the form. */
  question: string;
  /** Form constraints the answer must respect. */
  constraints: { maxLength?: number; kind: 'short' | 'long' };
  job: JobContext;
  candidate: CandidateContext;
}

export interface AnswerVariants {
  /** Balanced, natural answer. */
  answer: string;
  /** Short version (a few sentences). */
  concise: string;
  /** Formal tone. */
  professional: string;
}

export interface AIProvider {
  /** Stable id, e.g. "openai". */
  readonly id: string;
  /** Human name, e.g. "OpenAI". */
  readonly label: string;
  /** Where data is sent, shown on the consent screen, e.g. "api.openai.com". */
  readonly destination: string;
  generateAnswers(request: AnswerRequest, signal?: AbortSignal): Promise<AnswerVariants>;
}

export type ProviderId = 'openai' | 'gemini' | 'openai-compatible' | 'backend';

/** User configuration for AI answers. Stored locally; the key never ships in the extension. */
export interface AISettings {
  enabled: boolean;
  provider: ProviderId;
  model: string;
  /** For openai-compatible and backend providers. */
  baseUrl: string;
  /** Bring-your-own-key (openai, gemini, compatible) or a backend session token. */
  apiKey: string;
}

export class AIError extends Error {
  constructor(
    message: string,
    readonly kind: 'config' | 'auth' | 'network' | 'rate-limit' | 'provider' | 'parse',
  ) {
    super(message);
    this.name = 'AIError';
  }
}
