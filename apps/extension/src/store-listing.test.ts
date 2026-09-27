import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../manifest.config';

/**
 * Chrome Web Store requirements the manifest has to meet. The listing's title and
 * short description come straight from `name` and `description`.
 */
const m = manifest as unknown as {
  manifest_version: number;
  name: string;
  short_name?: string;
  description: string;
  version: string;
  icons: Record<string, string>;
};

function pngSize(file: string): [number, number] {
  const bytes = readFileSync(join(__dirname, '..', 'public', file));
  expect(bytes.subarray(0, 8).toString('latin1')).toBe('\x89PNG\r\n\x1a\n');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe('Chrome Web Store listing', () => {
  it('uses Manifest V3', () => {
    expect(m.manifest_version).toBe(3);
  });

  it('has the store name and short description, within the store limits', () => {
    expect(m.name).toBe('JobFill — Job Application Autofill');
    expect(m.name.length).toBeLessThanOrEqual(75);
    expect(m.short_name).toBe('JobFill');
    expect(m.short_name!.length).toBeLessThanOrEqual(12);
    expect(m.description).toBe('Save your profile once and autofill job applications in seconds.');
    expect(m.description.length).toBeLessThanOrEqual(132);
  });

  it('does not claim to work everywhere', () => {
    expect(`${m.name} ${m.description}`).not.toMatch(/\b(any|every|all)\b.*\b(site|form|ats)/i);
  });

  it('has a Chrome-style version string', () => {
    expect(m.version).toMatch(/^\d+(\.\d+){0,3}$/);
  });

  it('ships 16/32/48/128 px PNG icons at their declared sizes', () => {
    for (const size of [16, 32, 48, 128]) {
      expect(m.icons[size], `icon ${size}`).toBeDefined();
      expect(pngSize(m.icons[size]!)).toEqual([size, size]);
    }
  });
});
