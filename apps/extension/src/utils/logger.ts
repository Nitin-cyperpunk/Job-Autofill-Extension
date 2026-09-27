const PREFIX = '[JobFill]';

/** Dev-only logging. Never log profile values. */
export const logger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.info(PREFIX, ...args);
  },
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
};
