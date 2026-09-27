import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorName, logger } from './logger';

afterEach(() => vi.restoreAllMocks());

describe('logger', () => {
  it('reduces errors to their name — messages can carry candidate data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const err = new TypeError('Invalid email "ada.lovelace@example.com" at personal.email');
    logger.error('autofill failed', err);
    const printed = spy.mock.calls.flat().map(String).join(' ');
    expect(printed).toBe('[JobFill] autofill failed (TypeError)');
    expect(printed).not.toContain('ada.lovelace');
  });

  it('never prints non-Error values that were thrown', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('failed', { phone: '+44 20 7946 0000' });
    logger.error('failed', '+44 20 7946 0000');
    const printed = spy.mock.calls.flat().map(String).join(' ');
    expect(printed).not.toContain('7946');
    expect(errorName({})).toBe('object');
  });
});
