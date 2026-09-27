# JobFill launch checklist — Chrome Web Store

Work top to bottom. **Blockers** (🛑) stop submission. Items marked ✅ were done and verified
during the 2026-09-28 audit (see [AUDIT.md](AUDIT.md)). Recheck them after any code change.

## 0. Decisions only you can make 🛑

- [ ] **Support email:** a real inbox you monitor, for example `support@<your-domain>`. It goes
      in the dashboard, the privacy policy, the Support page and the FAQ.
- [ ] **Domain / website URL:** the site defaults to the placeholder `https://www.jobfill.app`.
      Register it or pick another, then set `NEXT_PUBLIC_SITE_URL`.
- [ ] **Publisher name:** shown on the listing and in the privacy policy ("Crafted by
      Nitinverse" on the site suggests _Nitinverse_; confirm).
- [ ] **Version:** keep `0.1.0` or ship as `1.0.0` (`apps/extension/package.json`).
- [ ] **Developer account:** Chrome Web Store developer registration (one-time fee),
      2-step verification on, and the contact email verified.

## 1. Chrome Web Store listing

- [x] ✅ Title "JobFill — Job Application Autofill" and short description, set in the manifest
      and pinned by a test.
- [ ] Paste the detailed description from [LISTING.md](LISTING.md), after replacing `⟨SITE_URL⟩`.
- [ ] Category: Productivity → Workflow & Planning. Language: English.
- [ ] Check the listing makes no universal claims ("any site", "every form", "all ATS"). The
      rules are at the end of LISTING.md.
- [ ] Optional: official URL / homepage (needs domain verification in Search Console).

## 2. Privacy policy 🛑

- [x] ✅ Text written: [PRIVACY_POLICY.md](PRIVACY_POLICY.md).
- [ ] Fill in ⟨DATE⟩, ⟨PUBLISHER NAME⟩, ⟨SUPPORT EMAIL⟩ and ⟨SITE_URL⟩.
- [ ] Publish it at `<site>/privacy`. The website's page must include the **Limited Use**
      sentence, the no-sale statement, retention, a contact and a "Last updated" date. These
      are all missing today and have been handed to the website owner.
- [ ] Enter the privacy policy URL in the dashboard's Privacy practices tab. Open it in a
      private window to make sure it loads without JavaScript errors.

## 3. Support email / page 🛑

- [ ] Support email set in the dashboard (Account → contact email, and the listing's support
      field).
- [ ] `<site>/support` has a real "Get help" section with the email. Today it's only a
      donate/share page with "coming soon" cards. Text to use: [SUPPORT.md](SUPPORT.md).
- [ ] `<site>/faq` matches [FAQ.md](FAQ.md) and adds the missing topics: why a field or resume
      wasn't filled, the reload-the-tab fix, `.doc` and scanned PDFs, multi-device use, and how
      to report a broken form.

## 4. Website 🛑

- [ ] Website fixes handed to the UI session are applied: universal-claim wording, privacy page
      additions, support page, and the exact Chrome permission warning on `/install`.
- [ ] Hide "coming soon" placeholders when their environment variables are empty.
- [ ] Deploy with `NEXT_PUBLIC_SITE_URL` set, plus `NEXT_PUBLIC_CHROME_WEB_STORE_URL` after the
      listing is approved.
- [ ] Run `npm run verify -w @jobfill/website` (build + SEO check) and open every page on a phone.

## 5. Screenshots

- [ ] 🛑 Regenerate once the UI theme pass is finished, so they show the final UI:
      `npm run build && node scripts/store/make-assets.mjs screenshots`.
- [ ] Check all 5 in `docs/store/assets/`: 1280×800, fictional data only, no real company
      names or logos, and text readable at 50% zoom.
- [ ] Upload at least 1 (up to 5), in the order screenshot-1 … 5.

## 6. Extension icon and promo images

- [x] ✅ Manifest icons 16/32/48/128. The 128 px icon has 96 px artwork with 16 px padding.
- [x] ✅ Store icon `docs/store/assets/store-icon-128.png`.
- [x] ✅ Small promo tile 440×280 (required) and marquee 1400×560 (optional).
- [ ] Upload them in the dashboard's Graphic assets section.

## 7. Store description

- [x] ✅ Drafted in LISTING.md. It lists supported field types and the tested page types, and
      states the limits (widgets, file uploads some sites block, scanned PDFs, `.doc`).
- [ ] Read it once more against the final UI wording (button names such as "Autofill
      Application", "Attach Resume", "Preview fields before filling").

## 8. Permission justification

- [x] ✅ Written in [PRIVACY_PRACTICES.md](PRIVACY_PRACTICES.md): single purpose, `storage`, and
      content-script site access (with the "why not activeTab" answer), remote code "No".
- [ ] Paste them into the Privacy practices tab. Tick the data categories and all three
      certifications as listed there.
- [ ] Expect **in-depth review** because of the site access. Plan for a longer review, and keep
      the justification to hand for reviewer questions.

## 9. Final QA (on the exact ZIP you upload) 🛑

Build the ZIP **after** all UI changes are finished:

- [ ] `npm run typecheck && npm run lint && npm test`: all green.
- [ ] `npm run package` succeeds (pre-flight checks pass) → `release/jobfill-<version>.zip`.
- [ ] Unzip it to a new folder. Open `chrome://extensions`, turn on Developer mode, **Load
      unpacked**, and pick that folder (not `apps/extension/dist`).
- [ ] Fresh install: onboarding opens. Import a PDF and a DOCX resume. Complete "Resume &
      Professional Links".
- [ ] On a real application form (a Greenhouse-, Lever- or Workday-hosted job posting and one
      company careers page):
  - [ ] LinkedIn, GitHub, portfolio, email, name and location fill, and the popup says ✓ Filled.
  - [ ] The resume attaches, or "Attach Resume" appears and works, or it clearly says to attach
        it manually.
  - [ ] Demographic and consent questions are left alone. Nothing is submitted.
  - [ ] Preview mode fills only the approved fields.
- [ ] Reload a tab opened before install, and open the popup on `chrome://extensions`. Both
      show a helpful message.
- [ ] AI (if you'll mention it in the listing): with a real key for **each** provider you list,
      generate one answer from the packed build. The consent screen names the destination.
- [ ] Export the profile, Delete all local data, then Import it back: the data round-trips.
- [ ] Rerun the axe check on the final build. Serious issues must be 0 (today there are 2
      types; fixes handed over).
- [ ] Remove the unpacked copy, then upload the same ZIP to the dashboard.

## After approval

- [ ] Set `NEXT_PUBLIC_CHROME_WEB_STORE_URL` and redeploy the website so "Add to Chrome" points
      to the listing.
- [ ] Watch the support inbox and store reviews in the first week. Fix field-mapping reports by
      adding cases to `mapping-accuracy.test.ts` first.
