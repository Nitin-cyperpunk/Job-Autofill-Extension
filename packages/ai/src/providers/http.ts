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
    throw new AIError('The AI provider rejected the API key. Check it in JobFill settings.', 'auth');
  }
  if (res.status === 429) throw new AIError('The AI provider is rate-limiting requests. Try again shortly.', 'rate-limit');
  if (!res.ok) throw new AIError(`The AI provider returned an error (${res.status}).`, 'provider');
  try {
    return await res.json();
  } catch {
    throw new AIError('The AI provider sent an unreadable response.', 'provider');
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
