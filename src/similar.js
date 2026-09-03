/* Near-duplicate detection. Kept separate from normalize.js because the
   thresholds here are judgement calls that will need tuning, and tuning is
   easier when the rules are in one readable place. */

// Damerau-Levenshtein (optimal string alignment). Plain Levenshtein scores
// an adjacent swap as two edits — googel/google, socail/social — which puts
// the most common human typo out of reach of a tight threshold. Counting a
// transposition as one edit catches those without loosening anything else.
function editDistance(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let twoBack = null;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, twoBack[j - 2] + 1);
      }
      row[j] = d;
      if (d < best) best = d;
    }
    if (best > max) return max + 1;
    twoBack = prev;
    prev = row;
  }
  return prev[b.length];
}

// A flat distance of 2 is far too loose on short values: cpc/ppc and
// cpm/cpc are one edit apart and mean entirely different things. Scale the
// tolerance to length so short mediums are never second-guessed.
function toleranceFor(value) {
  if (value.length < 5) return 0;   // cpc, ppc, sms, cpv — leave them alone
  if (value.length < 8) return 1;
  return 2;
}

// Values that differ only in their digits are almost always deliberate:
// spring-sale-2025 vs spring-sale-2026, q3-launch vs q4-launch. Suggesting
// one for the other is the fastest way to make this feature feel stupid.
function differsOnlyInDigits(a, b) {
  return a.replace(/\d+/g, "") === b.replace(/\d+/g, "");
}

// Returns the closest saved value worth suggesting, or null. Only ever one
// suggestion: a list of maybes is a decision, and this should be a nudge.
function nearestSaved(value, list) {
  if (!value || !Array.isArray(list) || !list.length) return null;
  if (typeof countMacros === "function" && countMacros(value)) return null;
  if (list.includes(value)) return null;   // already canonical, nothing to say

  const max = toleranceFor(value);
  if (!max) return null;

  let best = null;
  let bestDistance = max + 1;

  for (const candidate of list) {
    if (differsOnlyInDigits(value, candidate)) continue;
    const d = editDistance(value, candidate, max);
    if (d <= max && d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}
