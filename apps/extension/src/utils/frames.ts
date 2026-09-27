import type { ExtensionMessage, FillSummary, MessageResponse } from '@jobfill/shared';
import type { PlanItem } from '@jobfill/field-mapper';
import { targetTabId } from './messaging';

/**
 * Multi-frame orchestration for the popup. Application forms are often embedded
 * in iframes (e.g. a Greenhouse board inside a company careers page). The content
 * script runs in every frame; frames that contain fields announce themselves.
 *
 * Field ids are namespaced per frame ("<frameId>:<fieldId>") so the popup can
 * preview and approve fields from several frames in one list.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function framesWithFields(tabId: number): Promise<number[]> {
  const found = new Set<number>([0]);
  const listener = (message: ExtensionMessage, sender: chrome.runtime.MessageSender) => {
    if (
      message?.type === 'FRAME_HAS_FIELDS' &&
      sender.tab?.id === tabId &&
      typeof sender.frameId === 'number'
    ) {
      found.add(sender.frameId);
    }
  };
  chrome.runtime.onMessage.addListener(listener);
  try {
    // Broadcast (no frameId): every frame's content script receives it.
    await chrome.tabs
      .sendMessage(tabId, { type: 'ANNOUNCE_FRAMES' } satisfies ExtensionMessage)
      .catch(() => null);
    await sleep(250); // let the other frames' announcements arrive
  } finally {
    chrome.runtime.onMessage.removeListener(listener);
  }
  return [...found].sort((a, b) => a - b);
}

export function sendToFrame<M extends ExtensionMessage>(
  tabId: number,
  frameId: number,
  message: M,
): Promise<MessageResponse<M['type']>> {
  return chrome.tabs.sendMessage(tabId, message, { frameId });
}

const uid = (frameId: number, fieldId: string) => `${frameId}:${fieldId}`;

function splitUid(id: string): [number, string] {
  const at = id.indexOf(':');
  return [Number(id.slice(0, at)), id.slice(at + 1)];
}

/** Plan across all frames. Throws only if the top frame is unreachable. */
export async function planAllFrames(): Promise<PlanItem[]> {
  const tabId = await targetTabId();
  const frames = await framesWithFields(tabId);
  const items: PlanItem[] = [];
  for (const frameId of frames) {
    const res = await sendToFrame(tabId, frameId, { type: 'AUTOFILL_PLAN' }).catch(
      (err: unknown) => {
        if (frameId === 0) throw err;
        return null;
      },
    );
    if (res?.ok)
      items.push(...res.items.map((item) => ({ ...item, fieldId: uid(frameId, item.fieldId) })));
  }
  return items;
}

/** Fill across all frames (or only the approved, namespaced field ids) and merge the summaries. */
export async function fillAllFrames(approvedIds?: string[]): Promise<FillSummary> {
  const tabId = await targetTabId();
  const frames = await framesWithFields(tabId);
  const byFrame = new Map<number, string[]>();
  for (const id of approvedIds ?? []) {
    const [frameId, fieldId] = splitUid(id);
    byFrame.set(frameId, [...(byFrame.get(frameId) ?? []), fieldId]);
  }

  const merged: FillSummary = {
    filledCount: 0,
    filled: [],
    review: [],
    skipped: 0,
    revealed: 0,
    questions: [],
  };
  for (const frameId of frames) {
    if (approvedIds && !byFrame.has(frameId)) continue;
    const res = await sendToFrame(tabId, frameId, {
      type: 'AUTOFILL_EXECUTE',
      fieldIds: approvedIds ? byFrame.get(frameId) : undefined,
    }).catch((err: unknown) => {
      if (frameId === 0) throw err;
      return null;
    });
    if (!res?.ok) continue;
    const s = res.summary;
    const tag = <T extends { fieldId: string }>(x: T) => ({
      ...x,
      fieldId: uid(frameId, x.fieldId),
    });
    merged.filledCount += s.filledCount;
    merged.filled.push(...s.filled.map(tag));
    merged.review.push(...s.review.map(tag));
    merged.skipped += s.skipped;
    merged.revealed = (merged.revealed ?? 0) + (s.revealed ?? 0);
    merged.questions!.push(...(s.questions ?? []).map(tag));
  }
  return merged;
}
