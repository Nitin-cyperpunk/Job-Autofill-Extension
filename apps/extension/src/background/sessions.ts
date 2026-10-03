/**
 * "Keep filling new steps" sessions, per tab.
 *
 * A session starts only when the user clicks Autofill on a page; it lets the content
 * script fill the next steps of the same application as the user moves through it —
 * including steps that are separate page loads on the same site. It expires after
 * SESSION_MS of inactivity, when the tab closes, or when the user stops it.
 *
 * Stored in chrome.storage.session: in memory only, cleared when the browser closes,
 * and not readable by content scripts. It holds tab ids, origins and counts — never
 * profile values.
 */

const KEY = 'jobfill.autoContinue';
export const SESSION_MS = 30 * 60 * 1000;

interface TabSession {
  origins: string[];
  until: number;
  filled: number;
  review: number;
}
type Sessions = Record<string, TabSession>;

async function read(): Promise<Sessions> {
  const stored = await chrome.storage.session.get(KEY);
  return (stored[KEY] as Sessions | undefined) ?? {};
}

async function write(sessions: Sessions): Promise<void> {
  await chrome.storage.session.set({ [KEY]: sessions });
}

function originOf(sender: chrome.runtime.MessageSender): string | null {
  if (sender.origin && sender.origin !== 'null') return sender.origin;
  try {
    return sender.url ? new URL(sender.url).origin : null;
  } catch {
    return null;
  }
}

/** A content script in a web page (not an extension page) — the only valid sender here. */
function contentSender(
  sender: chrome.runtime.MessageSender,
): { tabId: number; origin: string } | null {
  if (sender.id !== chrome.runtime.id || sender.tab?.id === undefined) return null;
  const origin = originOf(sender);
  if (!origin || !/^https?:/.test(origin)) return null;
  return { tabId: sender.tab.id, origin };
}

export async function startSession(sender: chrome.runtime.MessageSender): Promise<boolean> {
  const from = contentSender(sender);
  if (!from) return false;
  const sessions = await read();
  const current = sessions[from.tabId];
  const active = current && current.until > Date.now();
  sessions[from.tabId] = {
    origins: [...new Set([...(active ? current.origins : []), from.origin])],
    until: Date.now() + SESSION_MS,
    filled: active ? current.filled : 0,
    review: active ? current.review : 0,
  };
  await write(sessions);
  return true;
}

/** Should this page (same tab, same site) keep filling? Extends the session if so. */
export async function querySession(sender: chrome.runtime.MessageSender): Promise<boolean> {
  const from = contentSender(sender);
  if (!from) return false;
  const sessions = await read();
  const s = sessions[from.tabId];
  if (!s || s.until <= Date.now() || !s.origins.includes(from.origin)) return false;
  s.until = Date.now() + SESSION_MS;
  await write(sessions);
  return true;
}

export async function recordFilled(
  sender: chrome.runtime.MessageSender,
  filled: number,
  review: number,
): Promise<boolean> {
  const from = contentSender(sender);
  if (!from) return false;
  const sessions = await read();
  const s = sessions[from.tabId];
  if (!s || !s.origins.includes(from.origin)) return false;
  s.filled += Math.max(0, Math.floor(filled));
  s.review += Math.max(0, Math.floor(review));
  s.until = Date.now() + SESSION_MS;
  await write(sessions);
  if (s.filled > 0) {
    await chrome.action.setBadgeBackgroundColor({ tabId: from.tabId, color: '#1f5ad6' });
    await chrome.action.setBadgeText({ tabId: from.tabId, text: `+${Math.min(s.filled, 99)}` });
  }
  return true;
}

export async function sessionStatus(
  tabId: number,
): Promise<{ active: boolean; filled: number; review: number }> {
  const s = (await read())[tabId];
  const active = !!s && s.until > Date.now();
  return { active, filled: active ? s.filled : 0, review: active ? s.review : 0 };
}

export async function stopSession(tabId: number): Promise<void> {
  const sessions = await read();
  delete sessions[tabId];
  await write(sessions);
  await chrome.action.setBadgeText({ tabId, text: '' }).catch(() => undefined);
  // Tell every frame in the tab to stop watching for new steps.
  await chrome.tabs.sendMessage(tabId, { type: 'AUTOFILL_SESSION_STOP' }).catch(() => undefined);
}

export async function forgetTab(tabId: number): Promise<void> {
  const sessions = await read();
  if (!(tabId in sessions)) return;
  delete sessions[tabId];
  await write(sessions);
}
