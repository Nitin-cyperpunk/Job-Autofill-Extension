import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../manifest.config';

/**
 * Privacy invariants from the audit (docs/PRIVACY_ARCHITECTURE.md), checked against
 * the source so a change that breaks one fails CI instead of shipping.
 */

const ROOT = join(__dirname, '..', '..', '..');
const SOURCE_DIRS = ['apps/extension/src', 'packages'];

function sources(): Array<{ file: string; text: string }> {
  const out: Array<{ file: string; text: string }> = [];
  for (const dir of SOURCE_DIRS) {
    for (const entry of readdirSync(join(ROOT, dir), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name))
        continue;
      const path = join(entry.parentPath, entry.name);
      const file = relative(ROOT, path).split(sep).join('/');
      if (file.includes('/node_modules/') || file.includes('/dist')) continue;
      out.push({ file, text: readFileSync(path, 'utf8') });
    }
  }
  return out;
}

const FILES = sources();
const matching = (pattern: RegExp) =>
  FILES.filter(({ text }) => pattern.test(text)).map(({ file }) => file);

describe('privacy invariants', () => {
  it('scans the real source tree', () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it('makes network requests only from the AI provider HTTP helper', () => {
    expect(matching(/(?<![\w.])fetch\s*\(|fetchImpl\s*\(/)).toEqual([
      'packages/ai/src/providers/http.ts',
    ]);
    expect(
      matching(/XMLHttpRequest|new WebSocket|EventSource|sendBeacon|importScripts|new Image\(/),
    ).toEqual([]);
  });

  it('runs no remote or dynamic code', () => {
    expect(matching(/\beval\s*\(|new Function\s*\(/)).toEqual([]);
  });

  it('stores data only in chrome.storage.local — no sync, web storage or IndexedDB', () => {
    expect(matching(/storage\.sync|localStorage|sessionStorage|indexedDB/)).toEqual([]);
    expect(matching(/chrome\.storage\.local\.\w+\(/)).toEqual([
      'apps/extension/src/content/index.ts', // reads the debug-mode setting only
      'apps/extension/src/storage/local-storage.ts',
    ]);
  });

  it('keeps the AI settings (and API key) out of content scripts', () => {
    const readers = matching(/storage\/ai-settings|STORAGE_KEYS\.ai\b/).filter(
      (f) => f !== 'apps/extension/src/storage/ai-settings.ts',
    );
    expect(readers.length).toBeGreaterThan(0);
    for (const file of readers) {
      expect(file).toMatch(/^apps\/extension\/src\/(background|options)\//);
    }
  });

  it('logs only through the logger (and the opt-in field debugger)', () => {
    expect(matching(/\bconsole\.(log|info|warn|error|debug|table|dir|trace)\s*\(/)).toEqual([
      'apps/extension/src/field-detection/debug.ts',
      'apps/extension/src/utils/logger.ts',
    ]);
  });

  it('never sends cookies or referrers with AI requests', () => {
    const http = FILES.find((f) => f.file === 'packages/ai/src/providers/http.ts')!.text;
    expect(http).toContain("credentials: 'omit'");
    expect(http).toContain("referrerPolicy: 'no-referrer'");
  });
});

describe('manifest', () => {
  const m = manifest as unknown as Record<string, unknown>;

  it('asks only for storage — no host, optional or extra permissions', () => {
    expect(m.permissions).toEqual(['storage']);
    expect(m.host_permissions).toBeUndefined();
    expect(m.optional_permissions).toBeUndefined();
    expect(m.optional_host_permissions).toBeUndefined();
  });

  it('exposes nothing to web pages or other extensions', () => {
    expect(m.externally_connectable).toBeUndefined();
    expect(m.web_accessible_resources).toBeUndefined(); // CRXJS adds only content-script chunks
  });

  it('does not overclaim in the store description', () => {
    expect(String(m.description)).not.toMatch(/100%|never (collect|leave|send)/i);
  });
});
