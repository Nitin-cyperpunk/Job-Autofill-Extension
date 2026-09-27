import type { ExtensionMessage, MessageResponse } from '@jobfill/shared';

export function sendToBackground<M extends ExtensionMessage>(
  message: M,
): Promise<MessageResponse<M['type']>> {
  return chrome.runtime.sendMessage(message);
}

/**
 * The tab the popup acts on: the active tab, or an explicit `?tabId=` (used when
 * the popup page is opened in a tab for automated end-to-end tests — only the
 * extension itself can open its popup URL).
 */
async function targetTabId(): Promise<number> {
  const explicit = Number(new URLSearchParams(location.search).get('tabId'));
  if (Number.isInteger(explicit) && explicit > 0) return explicit;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error('No active tab');
  return tab.id;
}

export async function sendToActiveTab<M extends ExtensionMessage>(
  message: M,
): Promise<MessageResponse<M['type']>> {
  return chrome.tabs.sendMessage(await targetTabId(), message);
}
