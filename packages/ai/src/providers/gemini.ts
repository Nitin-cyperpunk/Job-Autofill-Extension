import { parseVariants } from '../parse';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompt';
import { AIError, type AIProvider, type AnswerRequest, type AnswerVariants } from '../types';
import { postJson } from './http';

interface GeminiOptions {
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
}

/** Google Gemini (Generative Language API). The key goes in a header, not the URL. */
export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly label = 'Google Gemini';
  readonly destination = 'generativelanguage.googleapis.com';

  constructor(private readonly options: GeminiOptions) {
    if (!options.model) throw new AIError('Choose a model in JobFill settings.', 'config');
  }

  async generateAnswers(request: AnswerRequest, signal?: AbortSignal): Promise<AnswerVariants> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`;
    const data = (await postJson(
      url,
      {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(request) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      },
      { 'x-goog-api-key': this.options.apiKey },
      signal,
      this.options.fetchImpl,
    )) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!text) throw new AIError('The AI provider returned an empty answer.', 'provider');
    return parseVariants(text, request.constraints.maxLength);
  }
}
