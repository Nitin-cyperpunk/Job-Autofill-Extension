import { describe, expect, it } from 'vitest';
import { SUPPORT_URL, httpsUrlOrEmpty } from './links';

describe('support link', () => {
  it('uses the canonical Buy Me a Coffee page by default', () => {
    expect(SUPPORT_URL).toBe('https://buymeacoffee.com/nitinverse');
  });

  it('accepts only https URLs — anything else hides the card', () => {
    expect(httpsUrlOrEmpty(' https://buymeacoffee.com/someone ')).toBe(
      'https://buymeacoffee.com/someone',
    );
    expect(httpsUrlOrEmpty('http://buymeacoffee.com/nitinverse')).toBe('');
    expect(httpsUrlOrEmpty('javascript:alert(1)')).toBe('');
    expect(httpsUrlOrEmpty('buymeacoffee.com/nitinverse')).toBe('');
    expect(httpsUrlOrEmpty('')).toBe('');
    expect(httpsUrlOrEmpty(undefined)).toBe('');
  });
});
