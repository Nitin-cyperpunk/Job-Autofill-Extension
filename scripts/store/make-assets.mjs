// Chrome Web Store assets for JobFill, rendered in Chromium from the production build.
//
//   npm run build
//   npm i --no-save playwright-core@1     # no package.json / lockfile change
//   node scripts/store/make-assets.mjs [icons|screenshots|all]
// (or point PLAYWRIGHT_CORE at an existing playwright-core folder instead of installing)
//
// Needs a Chromium: Playwright's (npx playwright-core install chromium) or set CHROME=path.
// Everything shown is fictional sample data (Ada Lovelace, "Northwind Labs") on a local page.
// Output: docs/store/assets/.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(
  process.env.PLAYWRIGHT_CORE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_CORE, 'index.mjs')).href
    : 'playwright-core'
);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'docs', 'store', 'assets');
const DIST = path.join(ROOT, 'apps', 'extension', 'dist');
const mode = process.argv[2] ?? 'all';
fs.mkdirSync(OUT, { recursive: true });

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.cache'),
    'ms-playwright',
  );
  const dir = fs.existsSync(base)
    ? fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()
    : undefined;
  if (!dir) throw new Error('No Chromium found. Run: npx playwright-core install chromium');
  for (const rel of ['chrome-win64/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
    const p = path.join(base, dir, rel);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Chromium binary not found under ${path.join(base, dir)}`);
}

// ---- Brand art ------------------------------------------------------------------------------

const BRAND = { 600: '#1f5ad6', 500: '#2f6fed', 700: '#1a47a8', 900: '#0f2557' };

/** The JobFill mark: a rounded tile with three "form lines". `size` is the tile, not the canvas. */
function mark(size) {
  const r = size * 0.22;
  const bar = (y, w) =>
    `<rect x="${size * 0.22}" y="${size * y}" width="${size * w}" height="${size * 0.12}" rx="${size * 0.02}" fill="#fff"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND[500]}"/><stop offset="1" stop-color="${BRAND[700]}"/></linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
    ${bar(0.25, 0.56)}${bar(0.44, 0.44)}${bar(0.63, 0.3)}
  </svg>`;
}

const FONT = `font-family: 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif;`;

function iconPage() {
  // 96×96 artwork centred on a transparent 128×128 canvas (Chrome Web Store guidance).
  return `<html><body style="margin:0;background:transparent">
    <div style="width:128px;height:128px;display:grid;place-items:center">${mark(96)}</div></body></html>`;
}

function promoPage(w, h) {
  const big = h >= 500;
  return `<html><body style="margin:0">
  <div style="width:${w}px;height:${h}px;box-sizing:border-box;display:flex;align-items:center;gap:${big ? 56 : 24}px;
      padding:0 ${big ? 110 : 32}px;background:linear-gradient(135deg,${BRAND[900]} 0%,#0f2f75 55%,${BRAND[600]} 100%);${FONT}color:#fff">
    ${mark(big ? 200 : 96)}
    <div>
      <div style="font-size:${big ? 76 : 40}px;font-weight:700;letter-spacing:-0.02em">JobFill</div>
      <div style="font-size:${big ? 34 : 19}px;line-height:1.3;margin-top:${big ? 12 : 6}px;color:#dbe7ff;max-width:${big ? 900 : 260}px">
        Save your profile once. Autofill job applications in seconds.</div>
      ${big ? `<div style="margin-top:26px;font-size:24px;color:#bcdaff">Stored on your device · You review every field · Never submits for you</div>` : ''}
    </div>
  </div></body></html>`;
}

async function shoot(browser, html, { width, height, file, transparent = false }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: path.join(OUT, file), omitBackground: transparent });
  await page.close();
  console.log('wrote', path.relative(ROOT, path.join(OUT, file)));
}

async function makeIcons() {
  const browser = await chromium.launch({ executablePath: findChrome() });
  await shoot(browser, iconPage(), { width: 128, height: 128, file: 'store-icon-128.png', transparent: true });
  await shoot(browser, promoPage(440, 280), { width: 440, height: 280, file: 'promo-small-440x280.png' });
  await shoot(browser, promoPage(1400, 560), { width: 1400, height: 560, file: 'promo-marquee-1400x560.png' });
  await browser.close();
}

// ---- Screenshots ----------------------------------------------------------------------------

const FORM = `<!doctype html><html><head><meta charset="utf-8"><title>Northwind Labs — Apply: Staff Software Engineer</title>
<style>
  body{margin:0;${FONT}background:#f5f7fb;color:#0f172a}
  header{background:#fff;border-bottom:1px solid #e2e8f0;padding:18px 40px;font-weight:700;font-size:20px}
  header span{color:#64748b;font-weight:400;font-size:15px;margin-left:12px}
  main{max-width:640px;margin:28px 40px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:28px 32px}
  h1{font-size:22px;margin:0 0 4px} p.sub{margin:0 0 20px;color:#64748b;font-size:14px}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  label{display:block;font-size:13px;font-weight:600;margin:12px 0 5px}
  input,textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:9px 11px;font:inherit;font-size:14px;background:#fff}
  textarea{height:70px} .req{color:#dc2626}
  .file{border:1px dashed #94a3b8;border-radius:8px;padding:10px;font-size:13px;color:#475569}
</style></head><body>
<header>Northwind Labs <span>Careers · Sample application form</span></header>
<main><h1>Staff Software Engineer</h1><p class="sub">London · Full-time</p>
<form onsubmit="return false">
  <div class="row"><div><label for="fn">First name <span class="req">*</span></label><input id="fn"></div>
  <div><label for="ln">Last name <span class="req">*</span></label><input id="ln"></div></div>
  <div class="row"><div><label for="em">Email address <span class="req">*</span></label><input id="em" type="email"></div>
  <div><label for="ph">Phone</label><input id="ph" type="tel"></div></div>
  <label for="loc">Current location</label><input id="loc">
  <label for="li">LinkedIn Profile URL <span class="req">*</span></label><input id="li" type="url" value="https://">
  <div class="row"><div><label for="gh">GitHub</label><input id="gh" type="url"></div>
  <div><label for="pf">Portfolio</label><input id="pf" type="url"></div></div>
  <label for="cv">Resume/CV</label><div class="file"><input id="cv" type="file" accept=".pdf,.doc,.docx"></div>
  <label for="why">Why do you want to join Northwind Labs?</label><textarea id="why"></textarea>
</form></main></body></html>`;

const PROFILE = {
  schemaVersion: 2,
  personal: {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', phone: '+44 20 7946 0000',
    city: 'London', country: 'United Kingdom',
  },
  professional: { currentTitle: 'Staff Software Engineer', currentCompany: 'Analytical Engines Ltd', yearsOfExperience: '7' },
  skills: { technical: ['TypeScript', 'React', 'SQL'], soft: [], languages: ['English', 'French'] },
  links: {
    linkedin: 'https://linkedin.com/in/ada-lovelace', github: 'https://github.com/ada', portfolio: 'https://ada.dev',
    x: '', resumeUrl: '', website: '', other: [],
  },
  resume: { fileName: 'ada-lovelace-resume.pdf', mimeType: 'application/pdf', sizeBytes: 48213, uploadedAt: '2026-09-01T09:00:00.000Z' },
  createdAt: '2026-09-01T09:00:00.000Z', updatedAt: '2026-09-01T09:00:00.000Z', onboardingCompletedAt: '2026-09-01T09:00:00.000Z',
};

function frame({ caption, sub, images }) {
  // 1280×800: caption band on top, product captures below.
  return `<html><body style="margin:0">
  <div style="width:1280px;height:800px;box-sizing:border-box;${FONT}background:linear-gradient(160deg,#eef6ff,#dbe7ff);padding:34px 48px;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:14px">${mark(40)}
      <div style="font-size:30px;font-weight:700;color:${BRAND[900]};letter-spacing:-0.01em">${caption}</div></div>
    <div style="font-size:18px;color:#334155;margin:8px 0 22px 54px">${sub}</div>
    <div style="flex:1;display:flex;gap:28px;align-items:flex-start;justify-content:center;min-height:0">
      ${images
        .map(
          (img) =>
            `<img src="data:image/png;base64,${img.data}" style="max-height:${img.maxH ?? 640}px;max-width:${img.maxW ?? 1180}px;border-radius:12px;box-shadow:0 12px 40px rgba(15,37,87,.22);background:#fff">`,
        )
        .join('')}
    </div></div></body></html>`;
}

async function makeScreenshots() {
  if (!fs.existsSync(path.join(DIST, 'manifest.json'))) throw new Error('Run `npm run build` first.');
  const server = http.createServer((_, res) => res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(FORM));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const formUrl = `http://127.0.0.1:${server.address().port}/apply`;

  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jobfill-store-'));
  const ctx = await chromium.launchPersistentContext(userDir, {
    executablePath: findChrome(),
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`, '--window-position=-2400,0'],
  });
  const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
  const extId = new URL(sw.url()).host;
  const pdf = fs.readFileSync(path.join(ROOT, 'packages', 'resume', 'src', 'fixtures', 'chrome-resume.pdf'));
  await sw.evaluate(
    async ({ profile, data }) => {
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        'jobfill.profile.v2': profile,
        'jobfill.resume.v1': { ...profile.resume, dataBase64: data },
      });
    },
    { profile: PROFILE, data: pdf.toString('base64') },
  );
  // Close the onboarding tab Chrome opens on first install.
  await new Promise((r) => setTimeout(r, 800));
  for (const p of ctx.pages()) if (p.url().startsWith('chrome-extension://')) await p.close();

  const capture = async (page, opts = {}) => (await page.screenshot(opts)).toString('base64');
  const compose = async (file, spec) => {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(frame(spec));
    await page.screenshot({ path: path.join(OUT, file) });
    await page.close();
    console.log('wrote', path.relative(ROOT, path.join(OUT, file)));
  };

  // A form tab, and the popup page pointed at it (?tabId=) — the popup itself can't be screenshotted.
  const form = await ctx.newPage();
  await form.setViewportSize({ width: 760, height: 900 });
  await form.goto(formUrl);
  await form.waitForTimeout(1200);
  const tabId = await sw.evaluate(async () => (await chrome.tabs.query({})).find((t) => !t.url?.startsWith('chrome'))?.id ?? (await chrome.tabs.query({})).at(-1).id);
  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 380, height: 600 });
  const popupUrl = `chrome-extension://${extId}/src/popup/index.html?tabId=${tabId}`;

  // Popup sized to its content: a short viewport + fullPage grows to fit.
  await popup.setViewportSize({ width: 380, height: 200 });
  const noScrollbars = (p) => p.addStyleTag({ content: '::-webkit-scrollbar{display:none}' });

  // 1. Autofill: the filled form + the verified summary.
  await popup.goto(popupUrl);
  await popup.waitForTimeout(900);
  await popup.getByRole('button', { name: /autofill application/i }).click();
  await popup.waitForTimeout(1500);
  const summaryShot = await capture(popup, { fullPage: true });
  await form.bringToFront();
  const formShot = await capture(form, { clip: { x: 0, y: 0, width: 760, height: 900 } });

  // 2. Preview mode on a fresh copy of the form (the setting persists, so this runs second).
  await form.reload();
  await form.waitForTimeout(1200);
  await popup.goto(popupUrl);
  await popup.waitForTimeout(900);
  await popup.getByLabel(/preview fields before filling/i).check();
  await popup.getByRole('button', { name: /autofill application|preview/i }).first().click();
  await popup.waitForTimeout(1200);
  const previewShot = await capture(popup, { fullPage: true });
  await popup.getByLabel(/preview fields before filling/i).uncheck().catch(() => null);

  await compose('screenshot-1-autofill.png', {
    caption: 'Autofill an application in one click',
    sub: 'JobFill fills what it recognises from your profile and shows you exactly what it did.',
    images: [{ data: formShot, maxH: 640 }, { data: summaryShot, maxH: 640 }],
  });
  await compose('screenshot-2-preview.png', {
    caption: 'Preview before anything is filled',
    sub: 'Choose which fields to fill. Legal and personal questions are left for you to answer.',
    images: [{ data: previewShot, maxH: 640 }],
  });

  // 3. Profile: Resume & Professional Links.
  const options = await ctx.newPage();
  await options.setViewportSize({ width: 1200, height: 900 });
  await options.goto(`chrome-extension://${extId}/src/options/index.html#/onboarding/resume`);
  await options.waitForTimeout(1000);
  await noScrollbars(options);
  await compose('screenshot-3-profile.png', {
    caption: 'Set up your profile once',
    sub: 'Your resume, LinkedIn, portfolio and GitHub links, and your details, stored on this device.',
    images: [{ data: await capture(options), maxH: 640 }],
  });

  // 4. Résumé import review.
  await options.goto(`chrome-extension://${extId}/src/options/index.html#/import-resume?from=profile`);
  await options.waitForTimeout(800);
  await options.evaluate(() => chrome.storage.local.set({ 'jobfill.profile.v2': { schemaVersion: 2 } }));
  await options.reload();
  await options.waitForTimeout(800);
  await options.locator('input[type=file]').first().setInputFiles({
    name: 'ada-lovelace-resume.pdf', mimeType: 'application/pdf', buffer: pdf,
  });
  await options.waitForTimeout(1800);
  await noScrollbars(options);
  await compose('screenshot-4-resume-import.png', {
    caption: 'Import your resume — read on your device',
    sub: 'PDF, DOCX or TXT. Review everything JobFill found and save only what you approve.',
    images: [{ data: await capture(options), maxH: 640 }],
  });

  // 5. Privacy & data controls.
  await sw.evaluate(async (profile) => chrome.storage.local.set({ 'jobfill.profile.v2': profile }), PROFILE);
  await options.goto(`chrome-extension://${extId}/src/options/index.html#/privacy`);
  await options.waitForTimeout(1000);
  await noScrollbars(options);
  await compose('screenshot-5-privacy.png', {
    caption: 'Your data stays on your device',
    sub: 'No account, no JobFill server. Export or delete everything at any time.',
    images: [{ data: await capture(options), maxH: 640 }],
  });

  await ctx.close();
  server.close();
}

if (mode === 'icons' || mode === 'all') await makeIcons();
if (mode === 'screenshots' || mode === 'all') await makeScreenshots();
