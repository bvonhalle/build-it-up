# Build it up — launch plan

Last updated: 3 September 2026 (decisions logged) · Version in build: 0.3.0
Rule: a card moves to Done only when the change is in the build *and* the brief matches it.

Columns: **Done** · **Doing** (max 2) · **Next** (ordered) · **Later** · **Not doing**
Each card: `ID · title · where the work happens · done-when`

---

## Done

- L-01 · Competitive teardown · project chat · 29 Jul
- L-02 · Chunk 0: manifest, sigil, shared `normalize.js` with macro guard · Code · 29 Jul
- L-03 · Chunk 1: paste-to-parse + near-duplicate detection (`similar.js`) · Code · 29 Jul
- L-04 · Icon set from sigil geometry (`icon.svg`, `icons/*.png`) · Code · 3 Sep
- L-06 · Ghost features decided: build last-used restore + fresh/reuse swap, strike destination "Use tab" · project chat · 3 Sep
  Follow-up: edit the brief's v0.2.0 "Shipped features" list to match (part of L-07).
- L-07 · Build last-used restore + fresh/reuse swap · Code · 3 Sep
  Values restore across popup close/open; the prompt slot shows "Reusing your last values · Clear", flipping to "Starting fresh · Use last values" on click. Outstanding: the brief's v0.2.0 "Shipped features" list still needs the matching edit (lives outside this repo).
- L-14 · Remove recent links: per-item × + clear-all, both with inline confirm (popup + options) · Code · 3 Sep
  Popup Recent gains a × on each row that flips that row in place to "Remove · Cancel", and a "Clear all" that flips to "Clear N? · Clear · Cancel"; one row confirms at a time. Options "Clear link history" now arms on first click and reverts if not confirmed. No removal is silent. No new permissions or storage keys — only mutates `history`.
- L-09 · Privacy policy on GitHub Pages · Code · 3 Sep
  Live at https://bvonhalle.github.io/build-it-up/. States plainly that nothing leaves the device and covers `activeTab` + `storage`.
- L-05 · Smoke test unpacked build · Chrome + Code
  Done when every line in the checklist below passes on a real link. `main` is pushed (github.com/bvonhalle/build-it-up); this checklist's first line is the one remaining piece of L-08 too.

## Doing



## Next

1. L-08 · Repo (public, MIT): `git init`, layout, `tools/make-icons.py`, `CHANGELOG.md` · Code
   `main` pushed, layout matches CLAUDE.md, icons generated, CI added. Only remaining: confirm no console errors loading unpacked (see L-05).
2. L-10 · Reshoot 3 × 1280×800 screenshots against the real build · you
   Done when nothing in a screenshot is absent from the source.
3. L-11 · Listing copy: title, summary, description, keywords · project chat
   Done when copy is sentence case, no exclamation marks, and leads with enforcement not URL building.
4. L-12 · Tag `v0.3.0`, zip, submit for review · Code + Web Store dashboard

## Later (post-launch, in priority order)

- L-13 · **0.3.1** · GA4 channel advisory — verify channel definitions against current Google docs first · project chat then Code
- L-20 · Distribution: F5Bot alerts, LinkedIn post, free naming-convention template
- L-21 · Named presets
- L-22 · CSV export of history
- L-23 · `chrome.storage.sync` — deferred for write-rate risk, needs a throttling design
- L-24 · Right-click → build from link (costs `contextMenus`, evaluate)
- L-25 · Pro tier via ExtensionPay, one-time price, after ~500 installs

## Not doing

- Link shortening, QR codes, any backend, any cloud sync that needs a server
- Paywalling taxonomy or last-used values (they *are* the product)

---

## Smoke test checklist (L-05)

- [ ] Loads unpacked, no errors in the popup or service worker console
- [ ] Sigil renders in popup and options, light and dark
- [ ] `Alt+Shift+U` opens the popup
- [ ] `{keyword}` and `${ad_id}` survive normalization and appear unencoded in both preview and copied link
- [ ] Paste a link that already has UTMs into Destination → fields reverse-fill, prompt appears once
- [ ] Type `facebook-ad` with `facebook-ads` saved → near-duplicate prompt; accepting swaps the value visibly
- [ ] Non-UTM query params and `#fragment` preserved
- [ ] `⌘/Ctrl+Enter` copies; history shows the link; options → clear history works
- [ ] Recent → × flips the row to "Remove · Cancel" (no silent delete); Remove drops it, Cancel reverts; "Clear all" → confirm empties the list, cancel leaves it; both survive reopen
- [ ] Options save normalizes and dedupes; "tidied N values" note appears where relevant

## Decision log

- 29 Jul · Name locked: "Build it up – the better UTM builder"
- 29 Jul · One-time pricing via ExtensionPay, not monthly
- 29 Jul · `storage.sync` out of 0.3.0
- 3 Sep · Icons keep alpha; only promo tiles get flattened
- 3 Sep · L-06 · Build last-used restore + fresh/reuse swap; strike "Use tab" (paste-to-parse covers refill)
- 3 Sep · L-13 · GA4 advisory ships in 0.3.1, not before submit — launch velocity first, follow-up release doubles as a maintained-signal
- 3 Sep · L-08 · Repo is public, MIT
