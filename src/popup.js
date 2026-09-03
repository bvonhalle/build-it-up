const FIELDS = ["source", "medium", "campaign", "term", "content"];
const REQUIRED = ["source", "medium", "campaign"];
const HISTORY_MAX = 12;

const DEFAULT_TAXONOMY = {
  source: ["google", "bing", "facebook", "instagram", "linkedin", "newsletter", "partner"],
  medium: ["cpc", "email", "social", "organic", "referral", "display", "affiliate"],
  campaign: [],
  term: [],
  content: []
};

const el = {
  dest: document.getElementById("dest"),
  out: document.getElementById("out"),
  copy: document.getElementById("copy"),
  reset: document.getElementById("reset"),
  fixNote: document.getElementById("fixNote"),
  recentList: document.getElementById("recentList"),
  recentCount: document.getElementById("recentCount"),
  openOptions: document.getElementById("openOptions"),
  prompt: document.getElementById("prompt"),
  promptText: document.getElementById("promptText"),
  promptAccept: document.getElementById("promptAccept"),
  promptDismiss: document.getElementById("promptDismiss")
};

const inputs = {};
FIELDS.forEach((f) => { inputs[f] = document.getElementById("f-" + f); });

let taxonomy = { ...DEFAULT_TAXONOMY };
let history = [];
let lastUrl = null;
let lastUsed = null;

/* ---------- prompt: one slot, one pattern ---------- */

// Paste-to-parse and near-duplicate detection both notice something, offer
// one fix, and take one click. They share a slot so there is only ever one
// thing to learn and only ever one thing on screen. Neither ever blocks:
// the copy button stays live whatever the prompt says.

let prompt = null;                  // { kind, onAccept, onDismiss }
const dismissed = new Set();        // "field:value" pairs the user overruled

function showPrompt(next) {
  prompt = next;
  el.promptText.innerHTML = next.html;
  el.promptAccept.textContent = next.accept || "";
  el.promptAccept.hidden = !next.accept;
  if (next.key) el.prompt.dataset.key = next.key;
  else delete el.prompt.dataset.key;
  el.prompt.hidden = false;
}

function hidePrompt(kind) {
  if (kind && (!prompt || prompt.kind !== kind)) return;
  prompt = null;
  el.prompt.hidden = true;
  delete el.prompt.dataset.key;
}

el.promptAccept.addEventListener("click", () => {
  const act = prompt && prompt.onAccept;
  hidePrompt();
  if (act) act();
});

el.promptDismiss.addEventListener("click", () => {
  const act = prompt && prompt.onDismiss;
  hidePrompt();
  if (act) act();
});

/* ---------- last-used restore ---------- */

// Fresh/reuse is a flip, not a checkbox: the prompt always states the
// current state and offers the other one. It shares the prompt slot's
// markup, so it never stacks with a parse or dupe offer.

function showReusingPrompt() {
  showPrompt({
    kind: "restore",
    html: "Reusing your last values",
    accept: "Clear",
    onAccept: () => {
      FIELDS.forEach((f) => { inputs[f].value = ""; });
      renderPreview();
      showFreshPrompt();
    },
    onDismiss: () => {}
  });
}

function showFreshPrompt() {
  showPrompt({
    kind: "restore",
    html: "Starting fresh",
    accept: "Use last values",
    onAccept: () => {
      FIELDS.forEach((f) => { inputs[f].value = (lastUsed && lastUsed[f]) || ""; });
      renderPreview();
      showReusingPrompt();
    },
    onDismiss: () => {}
  });
}

async function saveLastUsed() {
  lastUsed = {};
  FIELDS.forEach((f) => { lastUsed[f] = normalize(inputs[f].value); });
  await chrome.storage.local.set({ lastUsed });
}

/* ---------- paste to parse ---------- */

// Tab autofill still strips UTMs silently — that is the established
// behaviour and setting the value in code never fires `input`, so this only
// ever runs on something the user typed or pasted.

let parseOfferedFor = null;

function utmsOn(raw) {
  let s = String(raw || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const found = {};
  let n = 0;
  FIELDS.forEach((f) => {
    const v = u.searchParams.get("utm_" + f);
    if (v) { found[f] = v; n += 1; }
  });
  return n ? found : null;
}

function offerParse(found) {
  const n = Object.keys(found).length;
  showPrompt({
    kind: "parse",
    html: `This link already carries ${n} UTM value${n > 1 ? "s" : ""}.`,
    accept: "Load them",
    onAccept: () => loadParsed(found),
    onDismiss: () => { parseOfferedFor = el.dest.value.trim(); }
  });
}

function loadParsed(found) {
  let tidied = 0;
  FIELDS.forEach((f) => {
    if (!(f in found)) return;
    const canon = normalize(found[f]);
    if (canon !== found[f]) tidied += 1;
    inputs[f].value = canon;
  });

  parseOfferedFor = el.dest.value.trim();
  const n = Object.keys(found).length;

  // The offer row becomes the receipt, so the tidying that happened on the
  // way in is stated rather than assumed.
  showPrompt({
    kind: "receipt",
    html: `Loaded ${n} value${n > 1 ? "s" : ""} from the link`
      + (tidied ? ` · tidied ${tidied}` : ""),
    onDismiss: () => {}
  });

  renderPreview();
}

/* ---------- near-duplicate detection ---------- */

// Runs on blur, never while typing. Suggests at most one alternative, and
// the user can always keep what they typed — if they do, it joins the saved
// list on copy like any other value.

function offerNearDuplicate(field, value) {
  if (!value || dismissed.has(field + ":" + value)) return;
  const near = nearestSaved(value, taxonomy[field] || []);
  if (!near) return;

  showPrompt({
    kind: "dupe",
    key: field,
    html: `Close to <code>${escapeHtml(near)}</code> — use that instead?`,
    accept: "Use it",
    onAccept: () => {
      inputs[field].value = near;
      renderPreview();
    },
    onDismiss: () => dismissed.add(field + ":" + value)
  });
}

/* ---------- the opinionated bit ---------- */
/* normalize(), countMacros() and restoreMacros() live in normalize.js,
   shared with the options page. */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- url assembly ---------- */

function buildUrl() {
  let raw = el.dest.value.trim();
  if (!raw) return { url: null, reason: "empty" };
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  let u;
  try {
    u = new URL(raw);
  } catch {
    return { url: null, reason: "badurl" };
  }

  // Drop any UTMs already on the link so we never stack duplicates.
  FIELDS.forEach((f) => u.searchParams.delete("utm_" + f));

  const missing = [];
  FIELDS.forEach((f) => {
    const v = normalize(inputs[f].value);
    if (v) u.searchParams.set("utm_" + f, v);
    else if (REQUIRED.includes(f)) missing.push(f);
  });

  if (missing.length) return { url: null, reason: "missing", missing };
  return { url: u, reason: null };
}

function renderPreview() {
  const { url, reason, missing } = buildUrl();

  // URLSearchParams escapes {, }, $, [ and ] on serialization, but the
  // preview below reads decoded values. Without this the copied link would
  // silently disagree with the link the user just read.
  lastUrl = url ? restoreMacros(url.toString()) : null;

  // Flag any value we had to rewrite, and any macro we deliberately left
  // alone, so both decisions are visible rather than silent.
  const fixed = FIELDS.filter((f) => {
    const v = inputs[f].value.trim();
    return v && normalize(v) !== v;
  });
  const kept = FIELDS.reduce((n, f) => n + countMacros(inputs[f].value), 0);

  const notes = [];
  if (fixed.length) notes.push(`tidied ${fixed.length} value${fixed.length > 1 ? "s" : ""}`);
  if (kept) notes.push(`${kept} macro${kept > 1 ? "s" : ""} kept`);
  el.fixNote.hidden = notes.length === 0;
  el.fixNote.textContent = notes.join(" · ");

  FIELDS.forEach((f) => {
    inputs[f].classList.toggle("invalid", REQUIRED.includes(f) && !normalize(inputs[f].value) && el.dest.value.trim() !== "");
  });

  if (!url) {
    const msg = {
      empty: "Add a destination link to start.",
      badurl: "That destination isn't a valid link.",
      missing: `Still needed: ${(missing || []).join(", ")}.`
    }[reason];
    el.out.innerHTML = `<span class="hint">${escapeHtml(msg)}</span>`;
    el.copy.disabled = true;
    return;
  }

  const base = url.origin + url.pathname;
  let html = `<span class="base">${escapeHtml(base)}</span>`;
  let first = true;
  url.searchParams.forEach((val, key) => {
    const m = key.match(/^utm_(\w+)$/);
    const cls = m && FIELDS.includes(m[1]) ? ` p p-${m[1]}` : "";
    html += `<span class="sep">${first ? "?" : "&amp;"}</span><span class="${cls.trim()}">${escapeHtml(key)}=${escapeHtml(val)}</span>`;
    first = false;
  });
  if (url.hash) html += `<span class="base">${escapeHtml(url.hash)}</span>`;

  el.out.innerHTML = html;
  el.copy.disabled = false;
}

/* ---------- storage ---------- */

async function load() {
  const got = await chrome.storage.local.get(["taxonomy", "history", "lastUsed"]);
  taxonomy = { ...DEFAULT_TAXONOMY, ...(got.taxonomy || {}) };
  history = got.history || [];
  lastUsed = got.lastUsed || null;
  FIELDS.forEach(fillDatalist);
  renderRecent();
}

function fillDatalist(f) {
  const dl = document.getElementById("l-" + f);
  dl.innerHTML = (taxonomy[f] || [])
    .map((v) => `<option value="${escapeHtml(v)}"></option>`)
    .join("");
}

// New values join the saved list, so the convention grows by use.
// Values carrying a macro are per-link and dynamic, so they stay out —
// otherwise the list fills with campaign-specific one-offs.
async function learn() {
  let changed = false;
  FIELDS.forEach((f) => {
    const v = normalize(inputs[f].value);
    if (countMacros(v)) return;
    if (v && !(taxonomy[f] || []).includes(v)) {
      taxonomy[f] = [...(taxonomy[f] || []), v].sort();
      changed = true;
    }
  });
  if (changed) {
    await chrome.storage.local.set({ taxonomy });
    FIELDS.forEach(fillDatalist);
  }
}

async function remember(url) {
  history = [{ url, ts: Date.now() }, ...history.filter((h) => h.url !== url)].slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ history });
  renderRecent();
}

function renderRecent() {
  el.recentCount.textContent = history.length ? `(${history.length})` : "";
  if (!history.length) {
    el.recentList.innerHTML = `<li class="empty">Links you build will collect here.</li>`;
    return;
  }
  el.recentList.innerHTML = history
    .map((h, i) => `<li><span class="snip" title="${escapeHtml(h.url)}">${escapeHtml(h.url)}</span><button data-i="${i}">Copy</button></li>`)
    .join("");
  el.recentList.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", async () => {
      await navigator.clipboard.writeText(history[+b.dataset.i].url);
      b.textContent = "Copied";
      setTimeout(() => { b.textContent = "Copy"; }, 1200);
    });
  });
}

/* ---------- wiring ---------- */

async function prefillFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !/^https?:/i.test(tab.url)) return;
    const u = new URL(tab.url);
    FIELDS.forEach((f) => u.searchParams.delete("utm_" + f));
    el.dest.value = u.toString();
  } catch { /* no tab access; user types it */ }
}

el.dest.addEventListener("input", () => {
  const raw = el.dest.value.trim();
  if (raw !== parseOfferedFor) {
    const found = utmsOn(raw);
    if (found) offerParse(found);
    else hidePrompt("parse");
  }
  renderPreview();
});

FIELDS.forEach((f) => {
  inputs[f].addEventListener("input", () => {
    // Editing the field the nudge is about retracts the nudge.
    if (prompt && prompt.kind === "dupe" && prompt.key === f) hidePrompt();
    renderPreview();
  });
  // Normalize on blur so people see the canonical value they just committed
  // to, then check it against what they have used before.
  inputs[f].addEventListener("blur", () => {
    const v = normalize(inputs[f].value);
    if (v) inputs[f].value = v;
    renderPreview();
    offerNearDuplicate(f, v);
  });
});

el.copy.addEventListener("click", async () => {
  if (!lastUrl) return;
  await navigator.clipboard.writeText(lastUrl);
  el.copy.textContent = "Copied";
  el.copy.classList.add("done");
  await learn();
  await remember(lastUrl);
  await saveLastUsed();
  setTimeout(() => {
    el.copy.textContent = "Copy link";
    el.copy.classList.remove("done");
  }, 1300);
});

el.reset.addEventListener("click", () => {
  FIELDS.forEach((f) => { inputs[f].value = ""; });
  hidePrompt();
  renderPreview();
  inputs.source.focus();
});

el.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !el.copy.disabled) el.copy.click();
});

(async function init() {
  await Promise.all([load(), prefillFromTab()]);
  if (lastUsed && FIELDS.every((f) => !inputs[f].value.trim())) {
    FIELDS.forEach((f) => { inputs[f].value = lastUsed[f] || ""; });
    showReusingPrompt();
  }
  renderPreview();
  el.dest.focus();
  el.dest.select();
})();
