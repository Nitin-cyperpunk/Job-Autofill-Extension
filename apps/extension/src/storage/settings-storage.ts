import { STORAGE_KEYS } from '@jobfill/shared';
import { getItem, setItem } from './local-storage';

/** Colour theme: follow the OS, or force light/dark. */
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  /** Safe mode: show what will be filled and let the user pick before writing anything. */
  previewBeforeFill: boolean;
  /** Developer view: detected / mapped / unmapped fields with confidence and reasons. */
  debugMode: boolean;
  theme: ThemePreference;
}

const DEFAULTS: Settings = { previewBeforeFill: false, debugMode: false, theme: 'system' };

type Flag = 'previewBeforeFill' | 'debugMode';

export async function loadSettings(): Promise<Settings> {
  const stored = await getItem<Partial<Settings>>(STORAGE_KEYS.settings);
  const flag = (key: Flag) =>
    typeof stored?.[key] === 'boolean' ? (stored[key] as boolean) : DEFAULTS[key];
  const theme = stored?.theme;
  return {
    previewBeforeFill: flag('previewBeforeFill'),
    debugMode: flag('debugMode'),
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
  };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await setItem(STORAGE_KEYS.settings, next);
  return next;
}
