/* Shared by popup.js and options.js.
   Loaded as a classic script before either, so both pages normalize
   identically. Two copies of this logic would eventually disagree, and the
   disagreement would be silent. */

// Ad-platform macros are expanded by the platform, not by us, and the
// platforms are case-sensitive about them. {keyword}, {{campaign.id}},
// ${ad_id} and [placement] all pass through untouched.
const MACRO_PATTERN = /\$\{[^{}]*\}|\{\{[^{}]*\}\}|\{[^{}]*\}|\[[^\[\]]*\]/g;

// Percent-encoded forms of the macro delimiters. URLSearchParams escapes
// these on serialization, which would hand the user a link that doesn't
// match the preview they just read.
const ENCODED_DELIMITERS = [
  [/%7B/gi, "{"],
  [/%7D/gi, "}"],
  [/%24/gi, "$"],
  [/%5B/gi, "["],
  [/%5D/gi, "]"]
];

// One canonical form for every value. "Facebook Ads" and "facebook_ads"
// both become "facebook-ads", so attribution never splits across variants.
// Edge hyphens are trimmed once at the end, not per segment, so the spaces
// around a macro survive as separators.
function normalizeSegment(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\s_+]+/g, "-")
    .replace(/[^a-z0-9\-.]/g, "")
    .replace(/-{2,}/g, "-");
}

function normalize(raw) {
  const s = String(raw == null ? "" : raw);
  let out = "";
  let last = 0;
  let m;

  MACRO_PATTERN.lastIndex = 0;
  while ((m = MACRO_PATTERN.exec(s)) !== null) {
    out += normalizeSegment(s.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  out += normalizeSegment(s.slice(last));

  return out.replace(/^-+|-+$/g, "");
}

function countMacros(raw) {
  const found = String(raw == null ? "" : raw).match(MACRO_PATTERN);
  return found ? found.length : 0;
}

// Undo the encoding URLSearchParams applies to macro delimiters, so the
// copied link matches the preview. Trade-off: a literal "%7B" the user
// typed on purpose would also be decoded. Chose that over shipping links
// that read utm_term=%7Bkeyword%7D.
function restoreMacros(urlString) {
  return ENCODED_DELIMITERS.reduce(
    (s, [pattern, char]) => s.replace(pattern, char),
    String(urlString)
  );
}
