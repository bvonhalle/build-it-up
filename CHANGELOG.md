# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Paste-to-parse: pasting a link with existing UTMs into destination reverse-fills the fields.
- Near-duplicate detection (`similar.js`) prompts when a typed value is close to a saved one.
- Macro-aware normalization: ad-platform macros like `{keyword}` and `${ad_id}` survive normalization and stay unencoded through preview and copy.
- Icon set generated from the sigil geometry (`icon.svg`, `tools/make-icons.py`, `src/icons/*.png`).

## [0.3.0] - 2026-07-29
### Added
- Initial build: manifest, sigil, shared `normalize.js` with macro guard.
