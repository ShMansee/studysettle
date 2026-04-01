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

wireLanguageButtons();
wireUniversitySelector();
highlightActiveNav();
wireMobileMenu();
applyTranslations(getLang());