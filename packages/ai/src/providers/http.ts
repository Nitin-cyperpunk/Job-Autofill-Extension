import { AIError } from '../types';

/** fetch + JSON with errors mapped to user-meaningful categories. Never logs keys or bodies. */
export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new AIError('Couldn’t reach the AI provider. Check your connection.', 'network');
  }
  if (res.status === 401 || res.status === 403) {
    throw new AIError(
      'The AI provider rejected the API key. Check it in JobFill settings.',
      'auth',
    );
  }
  if (res.status === 429)
    throw new AIError(
      'The AI provider is rate-limiting requests. Try again shortly.',
      'rate-limit',
    );
  if (!res.ok) throw new AIError(`The AI provider returned an error (${res.status}).`, 'provider');
  try {
    return await res.json();
  } catch {
    throw new AIError('The AI provider sent an unreadable response.', 'provider');
  }
}

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i;

/**
 * Validate a user-supplied endpoint before anything (answers, API key) is sent to it:
 * https only — plain http is allowed just for this machine (a local model server),
 * because the request carries the key and the candidate's approved details.
 * Credentials embedded in the URL are refused (they'd end up in logs and history).
 */
export function checkEndpoint(url: string, what = 'The endpoint URL'): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AIError(`${what} isn’t a valid URL.`, 'config');
  }
  const local = LOOPBACK.test(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) {
    throw new AIError(
      `${what} must use https (plain http is only allowed for localhost).`,
      'config',
    );
  }
  if (parsed.username || parsed.password) {
    throw new AIError(`${what} must not contain a username or password.`, 'config');
  }
  return url;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
