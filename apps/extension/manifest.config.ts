import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

/**
 * Permissions are deliberately minimal:
 *  - storage:   keep the profile in chrome.storage.local (on-device only)
 *  - content script on http(s) pages: detects and fills forms in-page only
 * No remote code, no analytics, and no network requests carrying profile data.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'JobFill',
  description: 'Save your information once. Autofill job applications in seconds. 100% local.',
  version: pkg.version,
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_title: 'JobFill',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://*/*', 'http://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage'],
});
