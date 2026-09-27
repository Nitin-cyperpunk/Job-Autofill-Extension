# Chrome Web Store kit

Everything needed to publish JobFill on the Chrome Web Store.

| File                                           | What it's for                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)     | **Start here.** Blockers, decisions, and final QA on the ZIP.             |
| [AUDIT.md](AUDIT.md)                           | Production-readiness audit: 13 areas, what was fixed, what's open.        |
| [LISTING.md](LISTING.md)                       | Title, short and detailed description, category, graphic asset slots.    |
| [PRIVACY_PRACTICES.md](PRIVACY_PRACTICES.md)   | Dashboard Privacy tab: single purpose, permission justifications, data disclosures. |
| [PRIVACY_POLICY.md](PRIVACY_POLICY.md)         | Public privacy policy, to host at `<site>/privacy`.                       |
| [SUPPORT.md](SUPPORT.md) · [FAQ.md](FAQ.md)    | Public support page and FAQ text.                                         |
| [assets/](assets/)                             | Store icon, promo tiles, screenshots.                                     |

## Commands

```sh
npm run package                                    # build + pre-flight checks + release/jobfill-<version>.zip
npm i --no-save playwright-core@1                  # once; no package.json / lockfile change
node scripts/store/make-assets.mjs icons           # store icon + promo tiles
node scripts/store/make-assets.mjs screenshots     # 1280×800 screenshots from the production build
```

`⟨…⟩` marks values nobody has decided yet (support email, domain, publisher). Fill them in; don't guess.
