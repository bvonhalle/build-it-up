const FIELDS = ["source", "medium", "campaign", "term", "content"];

const DEFAULT_TAXONOMY = {
  source: ["google", "bing", "facebook", "instagram", "linkedin", "newsletter", "partner"],
  medium: ["cpc", "email", "social", "organic", "referral", "display", "affiliate"],
  campaign: [],
  term: [],
  content: []
};

const status = document.getElementById("status");

/* normalize() comes from normalize.js, shared with the popup. */

function paint(tax) {
  FIELDS.forEach((f) => {
    document.getElementById("t-" + f).value = (tax[f] || []).join("\n");
  });
}

function flash(msg) {
  status.textContent = msg;
  status.classList.add("show");
  setTimeout(() => status.classList.remove("show"), 1800);
}

async function init() {
  const got = await chrome.storage.local.get("taxonomy");
  paint({ ...DEFAULT_TAXONOMY, ...(got.taxonomy || {}) });
}

document.getElementById("save").addEventListener("click", async () => {
  const taxonomy = {};
  FIELDS.forEach((f) => {
    const seen = new Set();
    taxonomy[f] = document.getElementById("t-" + f).value
      .split("\n")
      .map(normalize)
      .filter((v) => v && !seen.has(v) && seen.add(v))
      .sort();
  });
  await chrome.storage.local.set({ taxonomy });
  paint(taxonomy);
  flash("Saved");
});

document.getElementById("restore").addEventListener("click", async () => {
  await chrome.storage.local.set({ taxonomy: DEFAULT_TAXONOMY });
  paint(DEFAULT_TAXONOMY);
  flash("Defaults restored");
});

document.getElementById("clearHistory").addEventListener("click", async () => {
  await chrome.storage.local.set({ history: [] });
  flash("History cleared");
});

init();
