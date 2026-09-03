# Build it up — the better UTM builder

Chrome extension (Manifest V3) that builds UTM campaign links from a saved naming
convention. It is a **consistency enforcer**, not a URL builder. If a change makes
it more like a generic UTM builder, say so before making it.

Plan and status live in `PLAN.md`. Update the relevant card when you finish work.

## Stack and hard constraints

- Vanilla JS, HTML, CSS. **No build step, no bundler, no dependencies, no backend.**
- All state in `chrome.storage.local`. `storage.sync` is deliberately not used yet.
- Permissions are `activeTab` + `storage` only. Do not add a permission without
  stating the case in the PR description and in `PLAN.md`.
- The store zip is `src/` only.

## Layout

```
src/            the extension (zip this)
  manifest.json
  popup.{html,css,js}     builder UI
  options.{html,css,js}   convention editor
  normalize.js            shared normalizer, macro-aware — loaded by both pages
  similar.js              Damerau-Levenshtein near-duplicate detection
  icon.svg, icons/        mark; regenerate PNGs with tools/make-icons.py
docs/           GitHub Pages (privacy policy)
store/          screenshots and promo tiles, not shipped
tools/          helper scripts
```

## Non-negotiables in code

- Ad-platform macros like `{keyword}` and `${ad_id}` must survive normalization
  and appear unencoded in the copied link. Preview and copy go through the same
  pipeline (`restoreMacros`). Any new string handling must be macro-aware.
- Corrections the tool makes to user input are always shown, never silent.
- Actions, not settings: show current state and offer the flip; no checkboxes
  about future behaviour.
- New UI reuses an existing pattern. Paste-to-parse and near-duplicate prompts
  share one prompt slot; keep it that way.

## Copy and style

- Sentence case, plain, no exclamation marks. Errors say what happened and what to do.
- Colours: tile `#14182A`; source `#8B85FF`, medium `#3ECBB8`, campaign `#E5AC5E`;
  accent `#3A34C9`. In-app values live in `popup.css` custom properties.

## Testing

No test runner. Load unpacked via `chrome://extensions`, then run the smoke
checklist in `PLAN.md`. Check both popup and service-worker consoles.
