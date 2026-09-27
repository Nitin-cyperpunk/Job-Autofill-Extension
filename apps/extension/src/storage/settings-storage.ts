import { STORAGE_KEYS } from '@jobfill/shared';
import { getItem, setItem } from './local-storage';

export interface Settings {
  /** Safe mode: show what will be filled and let the user pick before writing anything. */
  previewBeforeFill: boolean;
  /** Developer view: detected / mapped / unmapped fields with confidence and reasons. */
  debugMode: boolean;
}

const DEFAULTS: Settings = { previewBeforeFill: false, debugMode: false };

export async function loadSettings(): Promise<Settings> {
  const stored = await getItem<Partial<Settings>>(STORAGE_KEYS.settings);
  const flag = (key: keyof Settings) =>
    typeof stored?.[key] === 'boolean' ? (stored[key] as boolean) : DEFAULTS[key];
  return { previewBeforeFill: flag('previewBeforeFill'), debugMode: flag('debugMode') };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await setItem(STORAGE_KEYS.settings, next);
  return next;
}
