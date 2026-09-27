import type { AnswerRequest } from './types';

/**
 * Provider-neutral prompt. Every provider sends these two strings; only the
 * transport differs. The request object is embedded as JSON so what is sent is
 * exactly what the user approved — no extra profile data is added here.
 */
export const SYSTEM_PROMPT = `You help a job applicant draft an answer to one question on a job application form.

Rules:
- Use ONLY the facts in the provided context. Never invent employers, job titles, dates, degrees, numbers, achievements or personal details.
- If the context lacks something, write around it rather than making it up.
- Write in the first person, as the applicant. No placeholders like [Company] — if the company name is unknown, don't mention one.
- Respect the maximum length if one is given.
- Return ONLY a JSON object with three string fields:
  "answer": a natural, specific answer (about 90–160 words for long questions, 1–2 sentences for short ones),
  "concise": a shorter version (at most about 60 words),
  "professional": a more formal version of similar length to "answer".`;

export function buildUserPrompt(request: AnswerRequest): string {
  const lengthNote = request.constraints.maxLength
    ? `Each version must be at most ${request.constraints.maxLength} characters.`
    : request.constraints.kind === 'short'
      ? 'This is a short text field: keep every version to one or two sentences.'
      : 'This is a long-answer field.';
  return [
    `Question: ${request.question}`,
    lengthNote,
    'Context (JSON):',
    JSON.stringify({ job: request.job, candidate: request.candidate }, null, 2),
  ].join('\n\n');
}
