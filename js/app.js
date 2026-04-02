import { applyTranslations, getLang, setLang } from "./i18n.js";

const UNIV_KEY = "university";

/* =========================
   LIVE listings via Google Sheets (CSV)
   ========================= */
const HOUSING_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQu6Cg-7WxSCMr_MtSzIMFZkZmgce5xVTDPFFaRU66BUaas9IjSkOje-JvWN-1U--5QJMNfLXiXpbFn/pub?gid=0&single=true&output=csv";

const HOUSING_REQUEST_EMAIL = "amanbekabilmansur@gmail.com";

/* ------------------------------
   Language + Nav
------------------------------ */
function wireLanguageButtons() {
  const buttons = {
    "lang-en": "en",
    "lang-az": "az",
    "lang-ru": "ru"
  };

  Object.entries(buttons).forEach(([id, lang]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      setLang(lang);
      applyTranslations(lang);
      updateActiveLangButton(lang);
    });
  });

  updateActiveLangButton(getLang());
}

function updateActiveLangButton(lang) {
  ["lang-en", "lang-az", "lang-ru"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle("active", id === `lang-${lang}`);
  });
}

function wireUniversitySelector() {
  const sel = document.getElementById("university-selector");
  if (!sel) return;
  const saved = localStorage.getItem(UNIV_KEY);
  if (saved) sel.value = saved;
  sel.addEventListener("change", () => {
    localStorage.setItem(UNIV_KEY, sel.value);
  });
}

function highlightActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-links a").forEach(a => {
    const href = a.getAttribute("href") || "";
    // Normalise: strip leading ".." and "/"
    const normalised = href.replace(/^\.\.\//, "").replace(/^\//, "");
    const isHome = (normalised === "index.html" || normalised === "");
    const isActive =
      path.endsWith(normalised) ||
      (isHome && (path.endsWith("/") || path.endsWith("index.html")));
    a.classList.toggle("active", isActive);
  });
}

function wireMobileMenu() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  // Close menu when a link is clicked
  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

/* ============================================================
   Housing Finder (LIVE via Google Sheets CSV)
   - Runs only on pages that have #hf-results
   - Filters locally by university, distance, rent, type
   - "Send request" uses mailto:
   ============================================================ */

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Simple CSV parser (handles commas + quotes)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    // escaped quote inside quoted field ("")
    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }

    // toggle quotes
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    // comma ends cell
    if (!inQuotes && ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    // newline ends row
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }

  // last cell/row
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows;
}

async function fetchListingsFromSheet() {
  const res = await fetch(HOUSING_SHEET_CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const csv = await res.text();

  const rows = parseCSV(csv).filter(r => r.some(c => String(c).trim() !== ""));
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  const listings = dataRows.map(r => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));

    // Sheet headers MUST be exactly:
    // active,title,type,rent,distanceKm,university,district,rooms,url
    return {
      active: String(obj.active).toLowerCase() === "true",
      title: obj.title,
      type: obj.type,
      rent: Number(obj.rent),
      distanceKm: Number(obj.distanceKm),
      university: obj.university,
      district: obj.district,
      rooms: obj.rooms ? Number(obj.rooms) : null,
      url: obj.url
    };
  });

  return listings.filter(x => x.active);
}

function initHousingFinder() {
  const resultsEl = document.getElementById("hf-results");
  if (!resultsEl) return;

  const uniEl = document.getElementById("hf-university");
  const distEl = document.getElementById("hf-distance");
  const priceEl = document.getElementById("hf-price");
  const distValEl = document.getElementById("hf-distance-value");
  const priceValEl = document.getElementById("hf-price-value");

  const chips = Array.from(document.querySelectorAll(".chip[data-type]"));
  let selectedType = "any";

  // Sync global university selector (top nav) -> finder
  const globalUni = document.getElementById("university-selector");
  if (globalUni && uniEl) {
    uniEl.value = globalUni.value;

    globalUni.addEventListener("change", () => {
      uniEl.value = globalUni.value;
      refresh();
    });

    uniEl.addEventListener("change", () => {
      globalUni.value = uniEl.value;
      localStorage.setItem(UNIV_KEY, uniEl.value);
      refresh();
    });
  }

  chips.forEach(btn => {
    btn.addEventListener("click", () => {
      chips.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedType = btn.dataset.type || "any";
      refresh();
    });
  });

  distEl?.addEventListener("input", refresh);
  priceEl?.addEventListener("input", refresh);
  uniEl?.addEventListener("change", refresh);

  let allListings = [];
  let loadedOnce = false;

  function applyFilters(listings) {
    const maxKm = Number(distEl.value);
    const maxPrice = Number(priceEl.value);

    distValEl.textContent = String(maxKm);
    priceValEl.textContent = String(maxPrice);

    return listings.filter(l => {
      const uniOk = l.university === uniEl.value;
      const typeOk = selectedType === "any" ? true : (l.type === selectedType);
      const kmOk = Number(l.distanceKm) <= maxKm;
      const priceOk = Number(l.rent) <= maxPrice;
      return uniOk && typeOk && kmOk && priceOk;
    });
  }

  function renderListings(listings) {
    if (!listings.length) {
      resultsEl.innerHTML = `
        <div class="housing-result">
          <h4>No live matches</h4>
          <p>Try increasing distance/budget, changing type, or switch university.</p>
          <div class="meta">
            <span class="pill">Live</span>
            <span class="pill">Google Sheet</span>
          </div>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = listings.map(l => `
      <div class="housing-result">
        <h4>${esc(l.title || "Listing")}</h4>
        <p>${esc(l.district || "Baku")} • ${esc(l.university || "")}</p>
        <div class="meta">
          <span class="pill">${esc(l.distanceKm)} km</span>
          <span class="pill">${esc(l.rent)} AZN</span>
          <span class="pill">${esc(l.type)}</span>
          ${l.rooms ? `<span class="pill">${esc(l.rooms)} rooms</span>` : ""}
        </div>
        ${l.url ? `<p style="margin-top:10px"><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">Open listing</a></p>` : ""}
      </div>
    `).join("");
  }

  async function loadListingsOnce() {
    resultsEl.innerHTML = `<div class="housing-result"><h4>Loading live listings…</h4><p>Please wait.</p></div>`;
    allListings = await fetchListingsFromSheet();
    loadedOnce = true;
  }

  async function refresh() {
    try {
      if (!loadedOnce) await loadListingsOnce();
      renderListings(applyFilters(allListings));
    } catch (e) {
      resultsEl.innerHTML = `
        <div class="housing-result">
          <h4>Could not load listings</h4>
          <p>Make sure the sheet is published as CSV and headers match exactly. Error: ${esc(e?.message || e)}</p>
        </div>
      `;
    }
  }

  // Form actions (mailto + copy)
  const form = document.getElementById("hf-form");
  const copyBtn = document.getElementById("hf-copy");

  function buildRequestText() {
    const name = (document.getElementById("hf-name")?.value || "").trim();
    const email = (document.getElementById("hf-email")?.value || "").trim();
    const budget = (document.getElementById("hf-budget")?.value || "").trim();
    const movein = (document.getElementById("hf-movein")?.value || "").trim();
    const msg = (document.getElementById("hf-message")?.value || "").trim();

    const uniText = uniEl?.options?.[uniEl.selectedIndex]?.text || "";

    return [
      `Housing request from: ${name}`,
      `Reply-to email: ${email}`,
      `University: ${uniText}`,
      `Max distance: ${distEl?.value || ""} km`,
      `Max rent: ${priceEl?.value || ""} AZN`,
      `Type: ${selectedType}`,
      budget ? `Budget note: ${budget}` : null,
      movein ? `Move-in date: ${movein}` : null,
      "",
      "Details:",
      msg || "(no extra details)",
    ].filter(Boolean).join("\n");
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = encodeURIComponent("StudySettle — Housing request");
    const body = encodeURIComponent(buildRequestText());
    window.location.href = `mailto:${HOUSING_REQUEST_EMAIL}?subject=${subject}&body=${body}`;
  });

  copyBtn?.addEventListener("click", async () => {
    const text = buildRequestText();
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy request text"), 1200);
    } catch {
      alert("Could not copy automatically. Please select the text and copy manually.");
    }
  });

  refresh();
}

/* ------------------------------ */
wireLanguageButtons();
wireUniversitySelector();
highlightActiveNav();
wireMobileMenu();
applyTranslations(getLang());
initHousingFinder();
