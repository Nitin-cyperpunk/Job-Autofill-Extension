const PREFIX = '[JobFill]';

/**
 * The only logger in the extension. Privacy rule: it never prints candidate data —
 * no profile values, résumé text, answers, page field values or API keys.
 *
 *  - Messages are fixed strings written by us; callers pass no data objects.
 *  - Errors are reduced to their `name` (e.g. "TypeError"). An error's message or
 *    properties can carry the data that caused it (a validation error echoes the
 *    rejected value, a DOM error can quote page content), so they are never printed.
 *  - `info` is dev-build only; release builds print nothing but the error line.
 */
export function errorName(err: unknown): string {
  if (err instanceof Error || err instanceof DOMException) return err.name || 'Error';
  return typeof err;
}

export const logger = {
  info: (message: string) => {
    if (import.meta.env.DEV) console.info(PREFIX, message);
  },
  error: (message: string, err?: unknown) => {
    if (err === undefined) console.error(PREFIX, message);
    else console.error(PREFIX, message, `(${errorName(err)})`);
  },
};
