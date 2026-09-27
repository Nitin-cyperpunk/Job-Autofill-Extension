import type { SiteAdapter } from './types';

/**
 * Registered site adapters. Intentionally empty: Google Forms, Greenhouse, Lever,
 * Workday-style and custom React/HTML forms are all handled by the generic layer
 * (see test-pages/ and the e2e checks). Add an adapter only as a last resort —
 * see the checklist in ./types.ts.
 */
const ADAPTERS: SiteAdapter[] = [];

export function adapterFor(url: string | URL, doc: Document, adapters: SiteAdapter[] = ADAPTERS): SiteAdapter | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  return adapters.find((adapter) => adapter.matches(parsed, doc)) ?? null;
}
