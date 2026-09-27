import { describe, expect, it, vi } from 'vitest';
import { sampleProfile } from '../../field-mapper/src/test-helpers';
import { BackendProvider } from './providers/backend';
import {
  AIError,
  GeminiProvider,
  OpenAIProvider,
  buildContextItems,
  buildRequest,
  buildUserPrompt,
  createProvider,
  fitLength,
  parseVariants,
  type ContextItemId,
  DEFAULT_AI_SETTINGS,
} from './index';

const profile = sampleProfile();
const job = {
  title: 'Senior Frontend Engineer',
  company: 'Example Co',
  description:
    'We build React and TypeScript products. You will lead a small team and mentor engineers.',
};
const question = { question: 'Why are you interested in this position?', kind: 'long' as const };

/** Every piece of contact / identity data in the sample profile. */
const PRIVATE_VALUES = [
  profile.personal.firstName,
  profile.personal.lastName,
  profile.personal.email,
  profile.personal.phone,
  profile.personal.address,
  profile.personal.postalCode,
  profile.links.linkedin,
  profile.links.github,
  profile.professional.expectedSalary,
  profile.professional.workAuthorization,
  profile.resume!.fileName,
];

describe('data minimization', () => {
  it('offers only question-relevant items, with exact previews', () => {
    const items = buildContextItems(question, profile, job);
    expect(items.map((i) => i.id)).toEqual([
      'jobTitle',
      'company',
      'jobDescription',
      'currentRole',
      'skills',
      'experience',
      'summary',
    ]);
    const skills = items.find((i) => i.id === 'skills')!;
    expect(skills.preview).toBe('TypeScript, React'); // only skills the job mentions
    expect(items.find((i) => i.id === 'summary')!.selected).toBe(false); // personal free text: opt-in
  });

  it('adds education only when the question is about it', () => {
    const edu = buildContextItems(
      { question: 'What did you study at university?', kind: 'long' },
      profile,
      job,
    );
    expect(edu.some((i) => i.id === 'education')).toBe(true);
    expect(buildContextItems(question, profile, job).some((i) => i.id === 'education')).toBe(false);
  });

  it('never includes contact, identity, salary or authorization data — even with everything approved', () => {
    const everything = new Set<ContextItemId>([
      'jobTitle',
      'company',
      'jobDescription',
      'currentRole',
      'skills',
      'experience',
      'education',
      'summary',
    ]);
    const request = buildRequest(
      { question: 'Tell us about your education', kind: 'long' },
      profile,
      job,
      everything,
    );
    const sent = JSON.stringify(request) + buildUserPrompt(request);
    for (const value of PRIVATE_VALUES) expect(sent).not.toContain(value);
  });

  it('sends nothing the user unticked', () => {
    const request = buildRequest(question, profile, job, new Set(['jobTitle', 'skills']));
    expect(request).toEqual({
      question: 'Why are you interested in this position?',
      constraints: { kind: 'long' },
      job: { title: 'Senior Frontend Engineer' },
      candidate: { skills: ['TypeScript', 'React'] },
    });
  });

  it('truncates long job descriptions', () => {
    const long = { ...job, description: 'word '.repeat(2000) };
    const request = buildRequest(question, profile, long, new Set(['jobDescription']));
    expect(request.job.description!.length).toBeLessThanOrEqual(3000);
  });
});

describe('response parsing', () => {
  it('accepts fenced JSON and enforces max length at a sentence boundary', () => {
    const raw =
      '```json\n{"answer":"First sentence. Second sentence that is long.","concise":"Short.","professional":"Formal answer."}\n```';
    const v = parseVariants(raw, 20);
    expect(v).toEqual({
      answer: 'First sentence.',
      concise: 'Short.',
      professional: 'Formal answer.',
    });
  });

  it('rejects incomplete replies', () => {
    expect(() => parseVariants('{"answer":"x"}')).toThrow(AIError);
    expect(() => parseVariants('not json')).toThrow(/expected format/);
  });

  it('fits text by words when there is no sentence break', () => {
    expect(fitLength('alpha beta gamma delta', 12)).toBe('alpha beta');
  });
});

const REPLY = { answer: 'A.', concise: 'B.', professional: 'C.' };

function mockFetch(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe('providers', () => {
  const request = buildRequest(question, profile, job, new Set(['jobTitle', 'skills']));

  it('OpenAI: bearer key in header, prompt carries only the request', async () => {
    const fetchImpl = mockFetch({ choices: [{ message: { content: JSON.stringify(REPLY) } }] });
    const provider = new OpenAIProvider({ apiKey: 'sk-test', model: 'gpt-test', fetchImpl });
    expect(await provider.generateAnswers(request)).toEqual(REPLY);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test');
    expect(init.credentials).toBe('omit');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('gpt-test');
    for (const value of PRIVATE_VALUES) expect(init.body).not.toContain(value);
  });

  it('Gemini: key in x-goog-api-key header, never in the URL', async () => {
    const fetchImpl = mockFetch({
      candidates: [{ content: { parts: [{ text: JSON.stringify(REPLY) }] } }],
    });
    const provider = new GeminiProvider({ apiKey: 'g-key', model: 'gemini-test', fetchImpl });
    expect(await provider.generateAnswers(request)).toEqual(REPLY);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain('g-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('g-key');
  });

  it('maps HTTP errors to helpful messages', async () => {
    const provider = new OpenAIProvider({
      apiKey: 'bad',
      model: 'm',
      fetchImpl: mockFetch({}, 401),
    });
    await expect(provider.generateAnswers(request)).rejects.toMatchObject({ kind: 'auth' });
    const limited = new OpenAIProvider({ apiKey: 'k', model: 'm', fetchImpl: mockFetch({}, 429) });
    await expect(limited.generateAnswers(request)).rejects.toMatchObject({ kind: 'rate-limit' });
  });

  it('registry refuses incomplete or disabled configurations', () => {
    expect(() => createProvider(DEFAULT_AI_SETTINGS)).toThrow(/turned off/);
    expect(() => createProvider({ ...DEFAULT_AI_SETTINGS, enabled: true })).toThrow(/API key/);
    // Not released: refused even when fully configured.
    expect(() =>
      createProvider({
        ...DEFAULT_AI_SETTINGS,
        enabled: true,
        provider: 'backend',
        apiKey: 't',
        baseUrl: 'https://service.example',
      }),
    ).toThrow(/isn’t available/);
    // …and the service itself only ever talks https.
    expect(() => new BackendProvider({ baseUrl: 'http://insecure', token: 't' })).toThrow(/https/);
    const compatible = createProvider({
      enabled: true,
      provider: 'openai-compatible',
      model: 'llama3',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: '',
    });
    expect(compatible.destination).toBe('localhost:11434');
  });

  it('refuses custom endpoints that would send the key or answers unprotected', () => {
    const compatible = (baseUrl: string) =>
      createProvider({
        enabled: true,
        provider: 'openai-compatible',
        model: 'm',
        baseUrl,
        apiKey: 'k',
      });
    expect(() => compatible('http://models.example.com/v1')).toThrow(/https/);
    expect(() => compatible('ftp://example.com')).toThrow(/https/);
    expect(() => compatible('not a url')).toThrow(/valid URL/);
    expect(() => compatible('https://user:pass@example.com/v1')).toThrow(/username/);
    expect(compatible('http://127.0.0.1:8080/v1').destination).toBe('127.0.0.1:8080');
    expect(compatible('https://api.groq.com/openai/v1').destination).toBe('api.groq.com');
  });
});
