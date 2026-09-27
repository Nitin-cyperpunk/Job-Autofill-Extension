/**
 * Thin, typed wrapper around chrome.storage.local.
 * Everything JobFill persists goes through here, so there is exactly one place
 * to audit that data stays on the device.
 */

export async function getItem<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

export async function getItems(keys: string[]): Promise<Record<string, unknown>> {
  return chrome.storage.local.get(keys);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await setItems({ [key]: value });
}

/** Writes all keys in one call, so related values (profile + resume) change together. */
export async function setItems(items: Record<string, unknown>): Promise<void> {
  try {
    await chrome.storage.local.set(items);
  } catch (err) {
    if (err instanceof Error && /quota/i.test(err.message)) throw new StorageQuotaError();
    throw err;
  }
}

export async function removeItem(key: string | string[]): Promise<void> {
  await chrome.storage.local.remove(key);
}

/** Removes everything JobFill has stored on this device. */
export async function clearAll(): Promise<void> {
  await chrome.storage.local.clear();
}

/** Bytes JobFill uses in local storage — in total, or for the given key(s). */
export async function getBytesInUse(key: string | string[] | null = null): Promise<number> {
  return chrome.storage.local.getBytesInUse(key);
}

/** Subscribe to changes of a single key. Returns an unsubscribe function. */
export function onItemChanged<T>(
  key: string,
  callback: (value: T | undefined) => void,
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && key in changes) callback(changes[key]?.newValue as T | undefined);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export class StorageQuotaError extends Error {
  constructor() {
    super('There isn’t enough local storage space for this. Try a smaller resume file.');
    this.name = 'StorageQuotaError';
  }
}
