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

## Doing

- L-05 · Smoke test unpacked build · Chrome + Code
  Done when every line in the checklist below passes on a real link.

## Next

1. L-07 · Build last-used restore + fresh/reuse swap · Code
   Done when values restore across popup close/open, the swap control shows current state and offers the flip, the restored state is announced (not silent), and the brief's shipped list is corrected.
2. L-08 · Repo (public, MIT): `git init`, layout, `tools/make-icons.py`, `CHANGELOG.md` · Code
   Done when `main` is pushed and `zip -r` of `src/` loads unpacked with no console errors.
3. L-09 · Privacy policy on GitHub Pages · draft in project chat, publish from Code
   Done when the URL is live and says: no data leaves the machine, `activeTab` + `storage` only.
4. L-10 · Reshoot 3 × 1280×800 screenshots against the real build · you
   Done when nothing in a screenshot is absent from the source.
5. L-11 · Listing copy: title, summary, description, keywords · project chat
   Done when copy is sentence case, no exclamation marks, and leads with enforcement not URL building.
6. L-12 · Tag `v0.3.0`, zip, submit for review · Code + Web Store dashboard

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
- [ ] Options save normalizes and dedupes; "tidied N values" note appears where relevant

## Decision log

- 29 Jul · Name locked: "Build it up – the better UTM builder"
- 29 Jul · One-time pricing via ExtensionPay, not monthly
- 29 Jul · `storage.sync` out of 0.3.0
- 3 Sep · Icons keep alpha; only promo tiles get flattened
- 3 Sep · L-06 · Build last-used restore + fresh/reuse swap; strike "Use tab" (paste-to-parse covers refill)
- 3 Sep · L-13 · GA4 advisory ships in 0.3.1, not before submit — launch velocity first, follow-up release doubles as a maintained-signal
- 3 Sep · L-08 · Repo is public, MIT
