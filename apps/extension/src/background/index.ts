import type { ExtensionMessage, MessageResponse } from '@jobfill/shared';
import { logger } from '@/utils/logger';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  logger.info('installed:', reason);
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    // First run: send the user straight to the profile page.
    void chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'PING': {
      const response: MessageResponse<'PING'> = { ok: true, from: 'background' };
      sendResponse(response);
      return false;
    }
    default:
      return false;
  }
});
