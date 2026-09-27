import { STORAGE_KEYS } from '@jobfill/shared';
import { getItem, setItem } from './local-storage';

export interface Settings {
  /** Safe mode: show what will be filled and let the user pick before writing anything. */
  previewBeforeFill: boolean;
}

const DEFAULTS: Settings = { previewBeforeFill: false };

export async function loadSettings(): Promise<Settings> {
  const stored = await getItem<Partial<Settings>>(STORAGE_KEYS.settings);
  return {
    previewBeforeFill:
      typeof stored?.previewBeforeFill === 'boolean'
        ? stored.previewBeforeFill
        : DEFAULTS.previewBeforeFill,
  };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await setItem(STORAGE_KEYS.settings, next);
  return next;
}
