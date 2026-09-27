import type { ExtensionMessage, MessageResponse } from '@jobfill/shared';
import { FieldWatcher } from '@/field-detection';
import type { DebugTools } from '@/field-detection/debug';
import { logger } from '@/utils/logger';

/**
 * Detection starts as soon as the page is idle and follows the page as it changes.
 * It only reads the DOM: nothing is filled until the user clicks Autofill.
 */
const watcher = new FieldWatcher(document);
watcher.start();

let debugTools: Promise<DebugTools> | null = null;
// Inline env check (not the DEBUG constant) so release builds drop this import entirely.
if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
  debugTools = import('@/field-detection/debug').then((m) => m.installDebugTools(watcher));
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'PING': {
      const response: MessageResponse<'PING'> = { ok: true, from: 'content' };
      sendResponse(response);
      return false;
    }
    case 'DETECT_FIELDS': {
      const fields = watcher.scanNow();
      const response: MessageResponse<'DETECT_FIELDS'> = {
        ok: true,
        count: fields.length,
        fields: fields.map((f) => f.descriptor),
        stats: { ...watcher.stats },
      };
      sendResponse(response);
      return false;
    }
    case 'DEBUG_OVERLAY': {
      if (!debugTools) {
        sendResponse({ ok: false } satisfies MessageResponse<'DEBUG_OVERLAY'>);
        return false;
      }
      void debugTools.then((tools) => {
        tools.setOverlay(message.show);
        sendResponse({ ok: true } satisfies MessageResponse<'DEBUG_OVERLAY'>);
      });
      return true;
    }
    // Autofill code (and the profile parser) is loaded on demand: it only reaches a
    // page when the user asks. Both handlers rescan first so the plan matches the page.
    case 'AUTOFILL_PLAN': {
      import('@/autofill')
        .then(({ planPage }) => planPage(watcher.scanNow()))
        .then((items) =>
          sendResponse({ ok: true, items } satisfies MessageResponse<'AUTOFILL_PLAN'>),
        )
        .catch((err: unknown) => {
          logger.error('autofill plan failed', err);
          sendResponse({
            ok: false,
            message: 'Couldn’t read this form.',
          } satisfies MessageResponse<'AUTOFILL_PLAN'>);
        });
      return true; // keep the channel open for the async response
    }
    case 'AUTOFILL_EXECUTE': {
      import('@/autofill')
        .then(({ fillPage }) => fillPage(watcher.scanNow(), message.fieldIds))
        .then((summary) =>
          sendResponse({ ok: true, summary } satisfies MessageResponse<'AUTOFILL_EXECUTE'>),
        )
        .catch((err: unknown) => {
          logger.error('autofill failed', err);
          sendResponse({
            ok: false,
            message: 'Autofill failed.',
          } satisfies MessageResponse<'AUTOFILL_EXECUTE'>);
        });
      return true;
    }
    default:
      return false;
  }
});

logger.info('content script ready');
