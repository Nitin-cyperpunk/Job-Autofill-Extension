import type { ExtensionMessage, FieldOutcome, MessageResponse } from '@jobfill/shared';
// The constants entry point, not the barrel: the barrel pulls in zod and every schema,
// which would be parsed on every page the user visits.
import { STORAGE_KEYS } from '@jobfill/shared/constants';
import { adapterFor } from '@/adapters';
import { CONTROL_SELECTOR, FieldWatcher } from '@/field-detection';
import type { DebugTools } from '@/field-detection/debug';
import { logger } from '@/utils/logger';

/**
 * Detection starts once the page is idle and follows the page as it changes.
 * It only reads the DOM: nothing is filled until the user clicks Autofill — after which
 * new steps of that application are filled as they render (see continueFilling).
 *
 * Runs in every frame (application forms are often embedded in iframes). Sub-frames
 * without form controls stay idle — no observer on ads and widgets.
 */
const isTopFrame = window === window.top;
const watcher = new FieldWatcher(document);
let started = false;
/** Outcomes of the last autofill run in this frame (debug panel). */
let lastFill: FieldOutcome[] = [];

function startWatching() {
  if (started) return;
  started = true;
  watcher.start();
  // Part of an application the user is already filling (a later step of the same site,
  // in the same tab)? Then keep filling as new steps render.
  void chrome.runtime
    .sendMessage({ type: 'AUTOFILL_SESSION_QUERY' } satisfies ExtensionMessage)
    .then((res: MessageResponse<'AUTOFILL_SESSION_QUERY'> | undefined) => {
      if (res?.active) void continueFilling([]);
    })
    .catch(() => null);
}

// ---- "Keep filling new steps" (multi-step applications) -----------------------------------
let session: import('@/autofill/continue-session').ContinueSession | null = null;

/**
 * Fill each new step of the application as it renders. Started only by the user's own
 * Autofill click (or a page of the same application in the same tab). Never navigates:
 * the user clicks Next / Continue / Submit.
 */
async function continueFilling(alreadyHandled: Iterable<string>): Promise<void> {
  if (session) {
    session.start(alreadyHandled);
    return;
  }
  const [{ ContinueSession }, { fillPage }] = await Promise.all([
    import('@/autofill/continue-session'),
    import('@/autofill'),
  ]);
  session ??= new ContinueSession({
    subscribe: (listener) => watcher.subscribe(listener),
    getFields: () => watcher.getFields(),
    run: (skip) =>
      fillPage(() => watcher.scanNow(), {
        adapter: adapterFor(location.href, document),
        skipIds: skip,
      }),
    onRun: (summary) => {
      const fresh = new Set((summary.outcomes ?? []).map((o) => o.fieldId));
      lastFill = [...lastFill.filter((o) => !fresh.has(o.fieldId)), ...(summary.outcomes ?? [])];
      if (summary.filledCount > 0 || summary.review.length > 0) {
        void chrome.runtime
          .sendMessage({
            type: 'AUTOFILL_SESSION_FILLED',
            filled: summary.filledCount,
            review: summary.review.length,
          } satisfies ExtensionMessage)
          .catch(() => null);
      }
    },
  });
  session.start(alreadyHandled);
}

if (isTopFrame || document.querySelector(CONTROL_SELECTOR)) {
  startWatching();
} else {
  // Embedded forms often render shortly after the frame loads.
  for (const delay of [1500, 5000]) {
    setTimeout(() => {
      if (!started && document.querySelector(CONTROL_SELECTOR)) startWatching();
    }, delay);
  }
}

// ---- Debug mode: dev builds, or the "Debug mode" setting ------------------------------------
const DEV_BUILD = import.meta.env.DEV || import.meta.env.MODE === 'development';
let debugTools: Promise<DebugTools> | null = null;

function loadDebugTools(): Promise<DebugTools> {
  debugTools ??= import('@/field-detection/debug').then((m) => m.installDebugTools(watcher));
  return debugTools;
}

async function debugEnabled(): Promise<boolean> {
  if (DEV_BUILD) return true;
  const stored = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return (stored[STORAGE_KEYS.settings] as { debugMode?: boolean } | undefined)?.debugMode === true;
}

void debugEnabled().then((on) => {
  if (on && started) void loadDebugTools();
});
chrome.storage.onChanged.addListener((changes, area) => {
  const next = changes[STORAGE_KEYS.settings]?.newValue as { debugMode?: boolean } | undefined;
  if (area === 'local' && next?.debugMode && started) void loadDebugTools();
});

// ---- Messages -----------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'PING': {
      const response: MessageResponse<'PING'> = { ok: true, from: 'content' };
      sendResponse(response);
      return false;
    }
    case 'ANNOUNCE_FRAMES': {
      // Every frame gets this broadcast; frames with fields tell the popup who they are.
      const count = watcher.scanNow().length;
      if (count > 0) {
        startWatching();
        void chrome.runtime
          .sendMessage({ type: 'FRAME_HAS_FIELDS', count } satisfies ExtensionMessage)
          .catch(() => null);
      }
      sendResponse({ ok: true } satisfies MessageResponse<'ANNOUNCE_FRAMES'>);
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
      void debugEnabled().then(async (on) => {
        if (!on) return sendResponse({ ok: false } satisfies MessageResponse<'DEBUG_OVERLAY'>);
        (await loadDebugTools()).setOverlay(message.show);
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
          sendResponse({ ok: true, items, lastFill } satisfies MessageResponse<'AUTOFILL_PLAN'>),
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
        .then(({ fillPage }) =>
          fillPage(() => watcher.scanNow(), {
            fieldIds: message.fieldIds,
            adapter: adapterFor(location.href, document),
          }),
        )
        .then((summary) => {
          lastFill = summary.outcomes ?? [];
          sendResponse({ ok: true, summary } satisfies MessageResponse<'AUTOFILL_EXECUTE'>);
          // Not in preview mode: the user chose to fill this application — keep going as
          // new steps appear. Everything on the page now has been handled by this run.
          if (message.continueSession && !message.fieldIds) {
            void continueFilling(watcher.getFields().map((f) => f.descriptor.id));
            void chrome.runtime
              .sendMessage({ type: 'AUTOFILL_SESSION_START' } satisfies ExtensionMessage)
              .catch(() => null);
          }
        })
        .catch((err: unknown) => {
          logger.error('autofill failed', err);
          sendResponse({
            ok: false,
            message: 'Autofill failed.',
          } satisfies MessageResponse<'AUTOFILL_EXECUTE'>);
        });
      return true;
    }
    case 'AUTOFILL_SESSION_STOP': {
      session?.stop();
      sendResponse({ ok: true } satisfies MessageResponse<'AUTOFILL_SESSION_STOP'>);
      return false;
    }
    case 'ATTACH_RESUME': {
      const field = watcher.scanNow().find((f) => f.descriptor.id === message.fieldId);
      if (!field) {
        sendResponse({
          ok: false,
          message: 'That upload field is no longer on the page.',
        } satisfies MessageResponse<'ATTACH_RESUME'>);
        return false;
      }
      import('@/autofill')
        .then(({ attachResumeTo }) => attachResumeTo(field))
        .then((res) => {
          if (res.ok) {
            lastFill = lastFill.map((o) =>
              o.fieldId === message.fieldId ? { ...o, status: 'filled', reason: undefined } : o,
            );
          }
          sendResponse(res satisfies MessageResponse<'ATTACH_RESUME'>);
        })
        .catch(() =>
          sendResponse({
            ok: false,
            message: 'Couldn’t attach the resume.',
          } satisfies MessageResponse<'ATTACH_RESUME'>),
        );
      return true;
    }
    // ---- Optional AI answers: context for ONE question, and inserting the chosen answer.
    case 'AI_QUESTION_CONTEXT': {
      const field = watcher.scanNow().find((f) => f.descriptor.id === message.fieldId);
      if (!field) {
        sendResponse({
          ok: false,
          message: 'That field is no longer on the page.',
        } satisfies MessageResponse<'AI_QUESTION_CONTEXT'>);
        return false;
      }
      void import('@/ai/job-context').then(({ extractJobContext }) => {
        const d = field.descriptor;
        const maxLength = (field.element as HTMLTextAreaElement).maxLength;
        sendResponse({
          ok: true,
          question: [d.label, d.description].filter(Boolean).join(' — '),
          ...(maxLength > 0 ? { maxLength } : {}),
          kind: d.type === 'text' ? 'short' : 'long',
          hasValue: d.hasValue,
          job: extractJobContext(document),
        } satisfies MessageResponse<'AI_QUESTION_CONTEXT'>);
      });
      return true;
    }
    case 'AI_INSERT': {
      const field = watcher.scanNow().find((f) => f.descriptor.id === message.fieldId);
      if (!field) {
        sendResponse({
          ok: false,
          message: 'That field is no longer on the page.',
        } satisfies MessageResponse<'AI_INSERT'>);
        return false;
      }
      void import('@/ai/insert-answer').then(({ insertAnswer }) => {
        sendResponse(
          insertAnswer(field, message.text, {
            replace: message.replace,
          }) satisfies MessageResponse<'AI_INSERT'>,
        );
      });
      return true;
    }
    default:
      return false;
  }
});

logger.info(isTopFrame ? 'content script ready (top frame)' : 'content script ready (sub-frame)');
