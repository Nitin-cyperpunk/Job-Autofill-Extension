/**
 * The creator's Buy Me a Coffee page. Same source of truth as the website
 * (apps/website/lib/site.ts): NEXT_PUBLIC_BUYMEACOFFEE_URL when set at build time
 * (exposed to the extension via envPrefix in vite.config.ts), otherwise the canonical
 * default below — the same default the website uses.
 */
const DEFAULT_BUYMEACOFFEE_URL = 'https://buymeacoffee.com/nitinverse';

/** An https URL, or '' (then the support card isn't shown — never a broken link). */
export function httpsUrlOrEmpty(value: string | undefined): string {
  const url = value?.trim() ?? '';
  if (!/^https:\/\/\S+$/.test(url)) return '';
  try {
    return new URL(url).protocol === 'https:' ? url : '';
  } catch {
    return '';
  }
}

export const SUPPORT_URL = httpsUrlOrEmpty(
  import.meta.env.NEXT_PUBLIC_BUYMEACOFFEE_URL || DEFAULT_BUYMEACOFFEE_URL,
);
