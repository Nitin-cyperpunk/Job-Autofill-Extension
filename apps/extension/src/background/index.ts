import { AIError, createProvider, describeDestination } from '@jobfill/ai';
import type { ExtensionMessage, MessageResponse } from '@jobfill/shared';
import { loadAISettings } from '@/storage/ai-settings';
import { logger } from '@/utils/logger';
import {
  forgetTab,
  querySession,
  recordFilled,
  sessionStatus,
  startSession,
  stopSession,
} from './sessions';

chrome.tabs.onRemoved.addListener((tabId) => void forgetTab(tabId));

chrome.runtime.onInstalled.addListener(({ reason }) => {
  logger.info(`installed (${reason})`);
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // First run: send the user straight to the profile page.
    void chrome.runtime.openOptionsPage();
  }
});

/** Messages from JobFill's own pages (popup / options), not from content scripts in web pages. */
function fromExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return (
    sender.id === chrome.runtime.id && (sender.url ?? '').startsWith(chrome.runtime.getURL(''))
  );
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'PING': {
      const response: MessageResponse<'PING'> = { ok: true, from: 'background' };
      sendResponse(response);
      return false;
    }

    // ---- "Keep filling new steps" sessions (content scripts / popup) ---------------------
    case 'AUTOFILL_SESSION_START':
      void startSession(sender).then((ok) =>
        sendResponse({ ok } satisfies MessageResponse<'AUTOFILL_SESSION_START'>),
      );
      return true;
    case 'AUTOFILL_SESSION_QUERY':
      void querySession(sender).then((active) =>
        sendResponse({ active } satisfies MessageResponse<'AUTOFILL_SESSION_QUERY'>),
      );
      return true;
    case 'AUTOFILL_SESSION_FILLED':
      void recordFilled(sender, message.filled, message.review).then((ok) =>
        sendResponse({ ok } satisfies MessageResponse<'AUTOFILL_SESSION_FILLED'>),
      );
      return true;
    case 'AUTOFILL_SESSION_STATUS':
      if (!fromExtensionPage(sender)) return false;
      void sessionStatus(message.tabId).then((status) =>
        sendResponse(status satisfies MessageResponse<'AUTOFILL_SESSION_STATUS'>),
      );
      return true;
    case 'AUTOFILL_SESSION_STOP': {
      // From the popup (explicit tab) — content scripts receive STOP, they don't send it.
      const tabId = message.tabId;
      if (!fromExtensionPage(sender) || tabId === undefined) return false;
      void stopSession(tabId).then(() =>
        sendResponse({ ok: true } satisfies MessageResponse<'AUTOFILL_SESSION_STOP'>),
      );
      return true;
    }

    // ---- Optional AI answers. The API key is only ever read here. ----------------------
    case 'AI_STATUS': {
      if (!fromExtensionPage(sender)) return false;
      void loadAISettings().then((settings) => {
        let problem: string | undefined;
        try {
          createProvider(settings);
        } catch (err) {
          problem = err instanceof Error ? err.message : 'AI is not configured.';
        }
        sendResponse({
          enabled: settings.enabled,
          configured: settings.enabled && !problem,
          destination: describeDestination(settings),
          ...(problem ? { problem } : {}),
        } satisfies MessageResponse<'AI_STATUS'>);
      });
      return true;
    }
    case 'AI_GENERATE': {
      if (!fromExtensionPage(sender)) return false;
      void (async () => {
        try {
          const provider = createProvider(await loadAISettings());
          const variants = await provider.generateAnswers(
            message.request,
            AbortSignal.timeout(45_000),
          );
          sendResponse({ ok: true, variants } satisfies MessageResponse<'AI_GENERATE'>);
        } catch (err) {
          const text =
            err instanceof AIError
              ? err.message
              : err instanceof DOMException && err.name === 'TimeoutError'
                ? 'The AI provider took too long. Try again.'
                : 'Something went wrong generating the answer.';
          sendResponse({ ok: false, message: text } satisfies MessageResponse<'AI_GENERATE'>);
        }
      })();
      return true;
    }
    default:
      return false;
  }
});
