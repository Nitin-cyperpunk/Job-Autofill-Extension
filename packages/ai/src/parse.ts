import { AIError, type AnswerVariants } from './types';

/** Trim to `max` characters at a sentence (or word) boundary. */
export function fitLength(text: string, max?: number): string {
  const clean = text.replace(/\s+\n/g, '\n').trim();
  if (!max || clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1).trim();
  const word = cut.lastIndexOf(' ');
  return (word > 0 ? cut.slice(0, word) : cut).trim();
}

/**
 * Parse the model's reply into the three variants. Tolerates code fences and
 * surrounding prose; rejects anything without all three non-empty strings.
 */
export function parseVariants(raw: string, maxLength?: number): AnswerVariants {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  let data: unknown;
  try {
    data = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
  } catch {
    throw new AIError('The AI reply wasn’t in the expected format. Try again.', 'parse');
  }
  const obj = data as Record<string, unknown>;
  const pick = (key: keyof AnswerVariants) => {
    const value = obj?.[key];
    if (typeof value !== 'string' || !value.trim()) {
      throw new AIError('The AI reply was incomplete. Try again.', 'parse');
    }
    return fitLength(value, maxLength);
  };
  return { answer: pick('answer'), concise: pick('concise'), professional: pick('professional') };
}
