import { applyTranslations, getLang, setLang } from "./i18n.js";

const UNIV_KEY = "university";

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
    const isActive = path.endsWith(normalised) || (isHome && (path.endsWith("/") || path.endsWith("index.html")));
    a.classList.toggle("active", isActive);
  });
}

function wireMobileMenu() {
  const toggle = document.getElementById("nav-toggle");
  const links  = document.getElementById("nav-links");
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
   Housing Finder (runs only on pages that have #hf-results)
   - Filters are local UI only (example ranges, not live listings)
   - "Send request" uses mailto: to email you the details
   ============================================================ */

function initHousingFinder() {
  const resultsEl = document.getElementById("hf-results");
  if (!resultsEl) return; // only run on housing.html (or any page that includes the widget)

  const uniEl = document.getElementById("hf-university");
  const distEl = document.getElementById("hf-distance");
  const priceEl = document.getElementById("hf-price");
  const distValEl = document.getElementById("hf-distance-value");
  const priceValEl = document.getElementById("hf-price-value");

  const chips = Array.from(document.querySelectorAll(".chip[data-type]"));
  let selectedType = "any";

  // If the global university selector exists, sync it into the finder
  const globalUni = document.getElementById("university-selector");
  if (globalUni && uniEl) {
    uniEl.value = globalUni.value;
    globalUni.addEventListener("change", () => {
      uniEl.value = globalUni.value;
      render();
    });
    uniEl.addEventListener("change", () => {
      globalUni.value = uniEl.value;
      localStorage.setItem(UNIV_KEY, uniEl.value);
      render();
    });
  }

  // Example dataset (NOT live listings)
  const samples = [
    { title: "Shared room (near metro)", type: "shared", baseMin: 250, baseMax: 450, nearKm: 5 },
    { title: "Studio / 1-room (older building)", type: "studio", baseMin: 400, baseMax: 700, nearKm: 7 },
    { title: "Studio / 1-room (newer building)", type: "studio", baseMin: 600, baseMax: 1000, nearKm: 10 },
    { title: "2-room (share with roommate)", type: "two", baseMin: 550, baseMax: 1100, nearKm: 12 },
  ];

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    if (!uniEl || !distEl || !priceEl || !distValEl || !priceValEl) return;

    const maxKm = Number(distEl.value);
    const maxPrice = Number(priceEl.value);

    distValEl.textContent = String(maxKm);
    priceValEl.textContent = String(maxPrice);

    const filtered = samples.filter(s => {
      const typeOk = selectedType === "any" ? true : s.type === selectedType;
      const kmOk = s.nearKm <= maxKm;
      const priceOk = s.baseMin <= maxPrice;
      return typeOk && kmOk && priceOk;
    });

    if (filtered.length === 0) {
      resultsEl.innerHTML = `
        <div class="housing-result">
          <h4>No matches</h4>
          <p>Try increasing distance or budget.</p>
          <div class="meta">
            <span class="pill">Tip</span>
            <span class="pill">Adjust filters</span>
          </div>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = filtered.map(s => `
      <div class="housing-result">
        <h4>${esc(s.title)}</h4>
        <p>Example range based on typical areas and distance from campus.</p>
        <div class="meta">
          <span class="pill">${esc(s.nearKm)} km</span>
          <span class="pill">${esc(s.baseMin)}–${esc(s.baseMax)} AZN</span>
          <span class="pill">${esc(s.type)}</span>
        </div>
      </div>
    `).join("");
  }

  chips.forEach(btn => {
    btn.addEventListener("click", () => {
      chips.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedType = btn.dataset.type || "any";
      render();
    });
  });

  distEl?.addEventListener("input", render);
  priceEl?.addEventListener("input", render);
  uniEl?.addEventListener("change", render);

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

    // TODO: replace with YOUR real email address
    const to = "YOUR_EMAIL_HERE";

    const subject = encodeURIComponent("StudySettle — Housing request");
    const body = encodeURIComponent(buildRequestText());

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
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

  render();
}

wireLanguageButtons();
wireUniversitySelector();
highlightActiveNav();
wireMobileMenu();
applyTranslations(getLang());
initHousingFinder();
