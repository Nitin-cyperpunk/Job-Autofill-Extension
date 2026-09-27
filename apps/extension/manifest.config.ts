import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

/**
 * Permissions are deliberately minimal (pinned by src/privacy-guards.test.ts):
 *  - storage:   keep the profile in chrome.storage.local (on-device only)
 *  - content script on http(s) pages: detects and fills forms in-page only
 * No host_permissions: optional AI requests go from the background worker to the
 * user's chosen provider as ordinary CORS requests, without cookies. No remote code,
 * no analytics; see docs/PRIVACY_ARCHITECTURE.md.
 */
export default defineManifest({
  manifest_version: 3,
  // The Chrome Web Store listing takes its title and short description from these
  // (name ≤ 75 chars, description ≤ 132). short_name is what the toolbar and menus show.
  name: 'JobFill — Job Application Autofill',
  short_name: 'JobFill',
  description: 'Save your profile once and autofill job applications in seconds.',
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
      // Application forms are often embedded in iframes (e.g. job boards on careers sites).
      all_frames: true,
      match_about_blank: true,
    },
  ],
  permissions: ['storage'],
});
