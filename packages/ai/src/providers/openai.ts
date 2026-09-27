import { parseVariants } from '../parse';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { AIError, type AIProvider, type AnswerRequest, type AnswerVariants } from '../types';
import { hostOf, postJson } from './http';

interface OpenAIOptions {
  apiKey: string;
  model: string;
  /** Any OpenAI-compatible Chat Completions endpoint (Groq, Together, a local Ollama…). */
  baseUrl?: string;
  label?: string;
  id?: string;
  fetchImpl?: typeof fetch;
}

/** OpenAI Chat Completions — also used for OpenAI-compatible endpoints. */
export class OpenAIProvider implements AIProvider {
  readonly id: string;
  readonly label: string;
  readonly destination: string;
  private readonly url: string;

  constructor(private readonly options: OpenAIOptions) {
    const base = (options.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.url = `${base}/chat/completions`;
    this.id = options.id ?? 'openai';
    this.label = options.label ?? 'OpenAI';
    this.destination = hostOf(this.url);
    if (!options.model) throw new AIError('Choose a model in JobFill settings.', 'config');
  }

  async generateAnswers(request: AnswerRequest, signal?: AbortSignal): Promise<AnswerVariants> {
    const data = (await postJson(
      this.url,
      {
        model: this.options.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(request) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      },
      this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {},
      signal,
      this.options.fetchImpl,
    )) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AIError('The AI provider returned an empty answer.', 'provider');
    return parseVariants(content, request.constraints.maxLength);
  }
}
