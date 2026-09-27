import { fitLength } from '../parse';
import { AIError, type AIProvider, type AnswerRequest, type AnswerVariants } from '../types';
import { hostOf, postJson } from './http';

interface BackendOptions {
  /** e.g. https://api.jobfill.app/v1 — a JobFill-operated service, not an AI vendor. */
  baseUrl: string;
  /** Short-lived session token issued by the backend (not a vendor API key). */
  token: string;
  fetchImpl?: typeof fetch;
}

/**
 * The path to "no API keys in the browser". A future JobFill backend holds the
 * vendor credentials, applies rate limits and abuse checks, and calls the model.
 * The extension sends the same minimized AnswerRequest it would send a vendor.
 *
 * Contract:
 *   POST {baseUrl}/answers
 *   Authorization: Bearer <session token>
 *   Body: AnswerRequest (JSON)
 *   200 → { "answer": string, "concise": string, "professional": string }
 *
 * The backend must not persist request bodies beyond what abuse prevention needs,
 * and must document its retention policy.
 */
export class BackendProvider implements AIProvider {
  readonly id = 'backend';
  readonly label = 'JobFill service';
  readonly destination: string;

  constructor(private readonly options: BackendOptions) {
    if (!/^https:\/\//.test(options.baseUrl)) {
      throw new AIError('The JobFill service URL must use https.', 'config');
    }
    this.destination = hostOf(options.baseUrl);
  }

  async generateAnswers(request: AnswerRequest, signal?: AbortSignal): Promise<AnswerVariants> {
    const data = (await postJson(
      `${this.options.baseUrl.replace(/\/+$/, '')}/answers`,
      request,
      { Authorization: `Bearer ${this.options.token}` },
      signal,
      this.options.fetchImpl,
    )) as Partial<AnswerVariants>;
    if (!data.answer || !data.concise || !data.professional) {
      throw new AIError('The JobFill service returned an incomplete answer.', 'provider');
    }
    const max = request.constraints.maxLength;
    return { answer: fitLength(data.answer, max), concise: fitLength(data.concise, max), professional: fitLength(data.professional, max) };
  }
}
