import { STORAGE_KEYS } from '@jobfill/shared';
import { loadSettings, onItemChanged, type Settings, type ThemePreference } from '@/storage';

/**
 * Applies the saved colour theme to <html data-theme>. "system" removes the attribute so
 * the CSS follows prefers-color-scheme (packages/theme/theme.css). Pages call initTheme()
 * before their first render so there is no flash of the wrong theme, and stay in sync
 * when the choice changes in another JobFill page (popup ↔ options).
 */
export function applyTheme(pref: ThemePreference, animate = false): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 220);
  }
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

export async function initTheme(): Promise<void> {
  try {
    applyTheme((await loadSettings()).theme);
  } catch {
    // Storage unavailable: the CSS default (system) applies.
  }
  onItemChanged<Partial<Settings>>(STORAGE_KEYS.settings, (value) => {
    const theme = value?.theme;
    applyTheme(theme === 'light' || theme === 'dark' ? theme : 'system', true);
  });
}
