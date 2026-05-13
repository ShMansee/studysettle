import { applyTranslations, getLang, setLang } from "./i18n.js";
import { auth, db, isAdminEmail } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { supabase, supabaseReady } from "./supabase.js";

const UNIV_KEY = "university";
const LOGIN_PAGE = "pages/login.html";
const REGISTER_PAGE = "pages/register.html";
const DASHBOARD_PAGE = "pages/dashboard.html";
const ADMIN_PAGE = "pages/admin.html";

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

function getPagePath() {
  return window.location.pathname.replaceAll("\\", "/");
}

function isCurrentPage(pageSuffix) {
  const path = getPagePath();
  if (path.endsWith(pageSuffix)) return true;

  // Support extensionless routes like /pages/login from static servers.
  const withoutHtml = pageSuffix.endsWith(".html")
    ? pageSuffix.slice(0, -".html".length)
    : pageSuffix;
  return path.endsWith(withoutHtml);
}

function waitForAuthReady() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

function upsertAuthMessage(container, type, message) {
  if (!container) return;
  let box = container.querySelector("[data-auth-message]");
  if (!box) {
    box = document.createElement("div");
    box.setAttribute("data-auth-message", "true");
    box.className = "alert";
    box.style.marginBottom = "16px";
    container.prepend(box);
  }
  box.className = `alert ${type === "error" ? "alert-warning" : "alert-success"}`;
  box.textContent = message;
}

async function ensureUserProfile(user, extra = {}) {
  if (!user?.uid) return;
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  const role = isAdminEmail(user.email) ? "admin" : "user";

  if (existing.exists()) {
    await setDoc(
      profileRef,
      {
        email: user.email || "",
        role,
        updatedAt: serverTimestamp(),
        ...extra
      },
      { merge: true }
    );
    return;
  }

  await setDoc(profileRef, {
    uid: user.uid,
    email: user.email || "",
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra
  });
}

function wireLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach(link => {
    link.addEventListener("click", async event => {
      event.preventDefault();
      await signOut(auth);
      window.location.href = "../index.html";
    });
  });
}

async function initLoginPage() {
  if (!isCurrentPage(LOGIN_PAGE)) return;
  const form = document.querySelector("form");
  const card = document.querySelector(".form-card");
  if (!form || !card) return;

  const existingUser = await waitForAuthReady();
  if (existingUser) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim() || "";
    const password = document.getElementById("login-password")?.value || "";

    if (!email || !password) {
      upsertAuthMessage(card, "error", "Please enter both email and password.");
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credential.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      upsertAuthMessage(card, "error", `Login failed: ${error?.message || "Unknown error."}`);
    }
  });
}

async function initRegisterPage() {
  if (!isCurrentPage(REGISTER_PAGE)) return;
  const form = document.querySelector("form");
  const card = document.querySelector(".form-card");
  if (!form || !card) return;

  const existingUser = await waitForAuthReady();
  if (existingUser) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = document.getElementById("reg-name")?.value?.trim() || "";
    const email = document.getElementById("reg-email")?.value?.trim() || "";
    const university = document.getElementById("reg-university")?.value || "";
    const password = document.getElementById("reg-password")?.value || "";
    const confirm = document.getElementById("reg-confirm")?.value || "";

    if (!name || !email || !university || !password) {
      upsertAuthMessage(card, "error", "Please complete all fields.");
      return;
    }
    if (password.length < 8) {
      upsertAuthMessage(card, "error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      upsertAuthMessage(card, "error", "Passwords do not match.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credential.user, {
        name,
        university
      });
      upsertAuthMessage(card, "success", "Account created successfully. Redirecting...");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch (error) {
      upsertAuthMessage(card, "error", `Registration failed: ${error?.message || "Unknown error."}`);
    }
  });
}

function fillDashboardIdentity(profile, user) {
  const nameEl = document.querySelector(".sidebar-header .name");
  const emailEl = document.querySelector(".sidebar-header .email");
  if (nameEl) {
    nameEl.textContent = profile?.name || user?.displayName || "Student";
  }
  if (emailEl) {
    emailEl.textContent = user?.email || "";
  }

  const stats = document.querySelectorAll(".stat .num");
  if (stats?.[2]) {
    stats[2].textContent = profile?.university || localStorage.getItem(UNIV_KEY) || "N/A";
  }
}

async function initDashboardPage() {
  if (!isCurrentPage(DASHBOARD_PAGE)) return;
  wireLogoutButtons();

  const user = await waitForAuthReady();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await ensureUserProfile(user);
  const profileSnap = await getDoc(doc(db, "users", user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : null;
  fillDashboardIdentity(profile, user);
}

function renderAdminUsers(users) {
  const table = document.getElementById("admin-users-table");
  if (!table) return;

  if (!users.length) {
    table.innerHTML = `
      <tr>
        <td colspan="4">No users found yet.</td>
      </tr>
    `;
    return;
  }

  table.innerHTML = users
    .map(user => {
      const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : null;
      const createdText = createdAt ? createdAt.toLocaleDateString() : "-";
      const roleClass = user.role === "admin" ? "badge-yellow" : "badge-green";
      return `
        <tr>
          <td><strong>${esc(user.name || "Unnamed user")}</strong></td>
          <td>${esc(user.email || "-")}</td>
          <td><span class="badge badge-blue">${esc(user.university || "-")}</span></td>
          <td><span class="badge ${roleClass}">${esc(user.role || "user")}</span> • ${esc(createdText)}</td>
        </tr>
      `;
    })
    .join("");
}

function updateAdminStats(users) {
  const statNums = document.querySelectorAll(".stat .num");
  if (!statNums?.length) return;
  const universities = new Set(users.map(user => user.university).filter(Boolean));
  const admins = users.filter(user => user.role === "admin").length;
  if (statNums[0]) statNums[0].textContent = String(users.length);
  if (statNums[1]) statNums[1].textContent = String(universities.size);
  if (statNums[2]) statNums[2].textContent = String(admins);
  if (statNums[3]) statNums[3].textContent = "3";
}

async function initAdminPage() {
  if (!isCurrentPage(ADMIN_PAGE)) return;
  wireLogoutButtons();

  const user = await waitForAuthReady();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await ensureUserProfile(user);
  const myProfileSnap = await getDoc(doc(db, "users", user.uid));
  const myProfile = myProfileSnap.exists() ? myProfileSnap.data() : {};
  const isAdmin = myProfile.role === "admin" || isAdminEmail(user.email);

  if (!isAdmin) {
    window.location.href = "dashboard.html";
    return;
  }

  const nameEl = document.querySelector(".sidebar-header .name");
  const emailEl = document.querySelector(".sidebar-header .email");
  if (nameEl) nameEl.textContent = myProfile.name || "Admin Panel";
  if (emailEl) emailEl.textContent = user.email || "";

  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(usersQuery);
  const users = snap.docs.map(item => item.data());
  renderAdminUsers(users);
  updateAdminStats(users);
}

function initDocumentsTracker() {
  if (!isCurrentPage("pages/documents.html")) return;
  const checklistItems = Array.from(document.querySelectorAll(".checklist li"));
  if (!checklistItems.length) return;

  const progressText = document.getElementById("doc-progress-text");
  const progressFill = document.getElementById("doc-progress-fill");
  const storageKey = "docChecklistStateV1";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");

  checklistItems.forEach((item, idx) => {
    const title = item.querySelector("strong")?.textContent?.trim() || `Step ${idx + 1}`;
    const key = `${idx}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    item.dataset.docKey = key;

    const checkIcon = item.querySelector(".check-icon");
    if (checkIcon) checkIcon.remove();

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "doc-check-input";
    checkbox.checked = Boolean(saved[key]);
    checkbox.setAttribute("aria-label", `Complete ${title}`);
    item.prepend(checkbox);

    checkbox.addEventListener("change", () => {
      saved[key] = checkbox.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
      updateProgress();
    });
  });

  function updateProgress() {
    const done = checklistItems.filter(item => item.querySelector(".doc-check-input")?.checked).length;
    const total = checklistItems.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (progressText) progressText.textContent = `${done}/${total} steps completed`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  updateProgress();
}

function initMapPage() {
  const mapEl = document.getElementById("baku-map");
  if (!mapEl || !window.L) return;

  const map = window.L.map("baku-map").setView([40.3838, 49.8671], 12);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const universities = window.L.layerGroup();
  const neighborhoods = window.L.layerGroup();
  const metro = window.L.layerGroup();
  const useful = window.L.layerGroup();

  [
    ["ADA University", 40.3947, 49.8464],
    ["Baku State University", 40.3708, 49.8251],
    ["UNEC", 40.3969, 49.8587],
    ["Khazar University (Neftchilar)", 40.4062, 49.9450]
  ].forEach(([name, lat, lng]) => window.L.marker([lat, lng]).bindPopup(`🎓 ${name}`).addTo(universities));

  [
    ["Narimanov", 40.4020, 49.8709],
    ["Sahil", 40.3725, 49.8465],
    ["Yasamal", 40.3840, 49.8110],
    ["Xetai", 40.3777, 49.8892]
  ].forEach(([name, lat, lng]) => window.L.circle([lat, lng], { radius: 800, color: "#0ea5e9" }).bindPopup(`📍 ${name}`).addTo(neighborhoods));

  [
    ["28 May", 40.3790, 49.8496],
    ["Ganjlik", 40.4009, 49.8515],
    ["Neftchilar", 40.4146, 49.9448],
    ["Icherisheher", 40.3662, 49.8330]
  ].forEach(([name, lat, lng]) => window.L.marker([lat, lng]).bindPopup(`🚇 ${name} metro`).addTo(metro));

  [
    ["ASAN Service #1", 40.4019, 49.8537],
    ["State Migration Service", 40.4058, 49.8226],
    ["28 Mall", 40.3786, 49.8506],
    ["Baku Railway Station", 40.3797, 49.8491]
  ].forEach(([name, lat, lng]) => window.L.marker([lat, lng]).bindPopup(`🧭 ${name}`).addTo(useful));

  universities.addTo(map);
  neighborhoods.addTo(map);
  metro.addTo(map);
  useful.addTo(map);

  window.L.control.layers(null, {
    Universities: universities,
    Neighborhoods: neighborhoods,
    Metro: metro,
    "Useful Places": useful
  }).addTo(map);
}

function generateTrackingCode() {
  return `MSG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function initUniversityMessaging() {
  const form = document.getElementById("uni-message-form");
  const checkForm = document.getElementById("check-reply-form");
  if (!form && !checkForm) return;

  const statusBanner = document.getElementById("supabase-status");
  if (statusBanner) {
    statusBanner.className = `alert ${supabaseReady ? "alert-success" : "alert-warning"}`;
    statusBanner.textContent = supabaseReady
      ? "Messaging service is connected."
      : "Supabase is not configured yet. Add your URL/key in js/supabase.js.";
  }
  if (!supabaseReady || !supabase) return;

  const submitResult = document.getElementById("msg-submit-result");
  const replyResult = document.getElementById("reply-result");

  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      tracking_code: generateTrackingCode(),
      student_name: document.getElementById("msg-name")?.value?.trim(),
      student_email: document.getElementById("msg-email")?.value?.trim().toLowerCase(),
      university: document.getElementById("msg-university")?.value,
      question: document.getElementById("msg-question")?.value?.trim(),
      status: "new"
    };

    const { error } = await supabase.from("university_messages").insert(payload);
    if (error) {
      if (submitResult) submitResult.textContent = `Could not send message: ${error.message}`;
      return;
    }
    if (submitResult) {
      submitResult.innerHTML = `Message sent. Your tracking code is <strong>${esc(payload.tracking_code)}</strong>. Save it to check replies.`;
    }
    form.reset();
  });

  checkForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const code = document.getElementById("check-code")?.value?.trim().toUpperCase();
    const email = document.getElementById("check-email")?.value?.trim().toLowerCase();
    const { data, error } = await supabase
      .from("university_messages")
      .select("tracking_code, university, question, status, reply, created_at, replied_at")
      .eq("tracking_code", code)
      .eq("student_email", email)
      .maybeSingle();

    if (error || !data) {
      if (replyResult) replyResult.innerHTML = `<div class="alert alert-warning">No message found for that code + email.</div>`;
      return;
    }
    if (replyResult) {
      replyResult.innerHTML = `
        <div class="alert alert-info">
          <strong>Status:</strong> ${esc(data.status)}<br />
          <strong>University:</strong> ${esc(data.university)}<br />
          <strong>Question:</strong> ${esc(data.question)}<br />
          <strong>Reply:</strong> ${esc(data.reply || "No reply yet.")}
        </div>
      `;
    }
  });
}

function initUniversityAdmin() {
  const loginForm = document.getElementById("uni-admin-login-form");
  if (!loginForm) return;
  const resultEl = document.getElementById("uni-admin-login-result");
  const authCard = document.getElementById("uni-admin-auth-card");
  const panel = document.getElementById("uni-admin-panel");
  const contextEl = document.getElementById("uni-admin-context");
  const tbody = document.getElementById("uni-admin-messages-body");
  const replyForm = document.getElementById("uni-admin-reply-form");
  const selectedCodeEl = document.getElementById("uni-admin-selected-code");
  const replyTextEl = document.getElementById("uni-admin-reply-text");
  const replyResultEl = document.getElementById("uni-admin-reply-result");
  const logoutBtn = document.getElementById("uni-admin-logout");

  if (!supabaseReady || !supabase) {
    if (resultEl) resultEl.textContent = "Configure Supabase first in js/supabase.js.";
    return;
  }

  let currentUniversity = "";

  async function loadInbox() {
    const { data, error } = await supabase
      .from("university_messages")
      .select("id, tracking_code, student_name, student_email, question, status, reply, created_at")
      .eq("university", currentUniversity)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="4">Failed to load messages.</td></tr>`;
      return;
    }
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="4">No messages yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = data.map(row => `
      <tr data-message-id="${row.id}" data-code="${esc(row.tracking_code)}">
        <td>${esc(row.tracking_code)}</td>
        <td>${esc(row.student_name)}<br /><span class="muted">${esc(row.student_email)}</span></td>
        <td>${esc(row.question)}</td>
        <td>${esc(row.status)}</td>
      </tr>
    `).join("");

    tbody.querySelectorAll("tr[data-message-id]").forEach(tr => {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        selectedCodeEl.value = tr.getAttribute("data-code") || "";
      });
    });
  }

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("uni-admin-email")?.value?.trim().toLowerCase();
    const password = document.getElementById("uni-admin-password")?.value || "";

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      resultEl.textContent = `Login failed: ${error.message}`;
      return;
    }
    const { data: adminRow } = await supabase
      .from("university_admins")
      .select("university")
      .eq("email", email)
      .maybeSingle();

    if (!adminRow?.university) {
      resultEl.textContent = "No university admin mapping found for this account.";
      await supabase.auth.signOut();
      return;
    }
    currentUniversity = adminRow.university;
    authCard.style.display = "none";
    panel.style.display = "block";
    contextEl.textContent = `Logged in for university: ${currentUniversity}`;
    await loadInbox();
  });

  replyForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const code = selectedCodeEl.value.trim();
    const reply = replyTextEl.value.trim();
    if (!code || !reply) {
      replyResultEl.textContent = "Select a message and write a reply.";
      return;
    }
    const { error } = await supabase
      .from("university_messages")
      .update({ reply, status: "replied", replied_at: new Date().toISOString() })
      .eq("tracking_code", code)
      .eq("university", currentUniversity);
    if (error) {
      replyResultEl.textContent = `Reply failed: ${error.message}`;
      return;
    }
    replyResultEl.textContent = `Reply sent for ${code}.`;
    replyTextEl.value = "";
    await loadInbox();
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    panel.style.display = "none";
    authCard.style.display = "block";
    selectedCodeEl.value = "";
    replyTextEl.value = "";
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
  const locationEl = document.getElementById("hf-location");
  const binaSearchBtn = document.getElementById("hf-bina-search");
  const distValEl = document.getElementById("hf-distance-value");
  const priceValEl = document.getElementById("hf-price-value");
  const liveSummaryEl = document.getElementById("hf-live-summary");

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
  locationEl?.addEventListener("change", refresh);
  binaSearchBtn?.addEventListener("click", openBinaWithFilters);

  let allListings = [];
  let loadedOnce = false;
  const universityAreaHints = {
    ada: "Nizami Yasamal Sahil",
    "baku-state": "Yasamal Elmler Nizami",
    unec: "Narimanov Ganjlik 28 May",
    khazar: "Neftchilar Xetai 8 Noyabr"
  };
  const typeQueryHints = {
    any: "",
    shared: "shared room otaq yoldasi",
    studio: "1 otaqli studio",
    two: "2 otaqli"
  };
  const districtQueryHints = {
    Narimanov: "Narimanov",
    Nizami: "Nizami",
    Yasamal: "Yasamal",
    Elmler: "Elmler",
    Sahil: "Sahil",
    Icherisheher: "Icherisheher",
    "28 May": "28 May",
    Ganjlik: "Ganjlik",
    Xetai: "Xetai",
    Neftchilar: "Neftchilar",
    "8 Noyabr": "8 Noyabr",
    Bineqedi: "Bineqedi",
    Masazir: "Masazir"
  };

  function openBinaWithFilters() {
    const maxPrice = Number(priceEl?.value || 0);
    const maxDistance = Number(distEl?.value || 0);
    const selectedUni = uniEl?.value || "";
    const selectedDistrict = (locationEl?.value || "").trim();
    const locationHint = districtQueryHints[selectedDistrict] || universityAreaHints[selectedUni] || "";
    const typeHint = typeQueryHints[selectedType] || "";

    const qParts = [
      "kiraye menzil baki",
      typeHint,
      locationHint,
      maxDistance ? `universitye yaxin ${maxDistance} km` : ""
    ].filter(Boolean);

    const params = new URLSearchParams();
    params.set("items_all", "1");
    params.set("q", qParts.join(" "));
    if (maxPrice) params.set("price_to", String(maxPrice));

    window.open(`https://bina.az/items/all?${params.toString()}`, "_blank", "noopener,noreferrer");
  }

  function buildBinaLinkForListing(listing) {
    const parts = [
      "kiraye menzil baki",
      listing?.type ? String(listing.type) : "",
      listing?.district ? String(listing.district) : ""
    ].filter(Boolean);

    const params = new URLSearchParams();
    params.set("items_all", "1");
    params.set("q", parts.join(" "));
    if (Number(listing?.rent) > 0) {
      params.set("price_to", String(Number(listing.rent) + 100));
    }
    return `https://bina.az/items/all?${params.toString()}`;
  }

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
    if (liveSummaryEl) {
      liveSummaryEl.className = "alert alert-info";
      liveSummaryEl.textContent = `Live matches found: ${listings.length}`;
    }

    if (!listings.length) {
      resultsEl.innerHTML = `
        <div class="housing-result">
          <h4>No live matches</h4>
          <p>Try increasing distance/budget, changing type, or switch university.</p>
          <div class="meta">
            <span class="pill">Live</span>
            <span class="pill">Google Sheet</span>
          </div>
          <p style="margin-top:10px">
            <button class="btn btn-outline btn-sm" type="button" id="hf-bina-search-empty">Search similar on bina.az</button>
          </p>
        </div>
      `;
      const emptyBinaBtn = document.getElementById("hf-bina-search-empty");
      emptyBinaBtn?.addEventListener("click", openBinaWithFilters);
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
        <p style="margin-top:10px">
          <a href="${esc(buildBinaLinkForListing(l))}" target="_blank" rel="noopener noreferrer">Find similar on bina.az</a>
        </p>
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
      if (liveSummaryEl) {
        liveSummaryEl.className = "alert alert-warning";
        liveSummaryEl.textContent = "Could not load live matches right now.";
      }
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
    const area = districtQueryHints[(locationEl?.value || "").trim()] || "";

    return [
      `Housing request from: ${name}`,
      `Reply-to email: ${email}`,
      `University: ${uniText}`,
      area ? `Preferred area: ${area}` : null,
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

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const requestText = buildRequestText();
    const subject = encodeURIComponent("StudySettle — Housing request");
    const body = encodeURIComponent(requestText);

    const user = auth.currentUser;
    if (!user) {
      window.location.href = `mailto:${HOUSING_REQUEST_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }

    try {
      await addDoc(collection(db, "requests"), {
        uid: user.uid,
        email: user.email || "",
        university: uniEl?.value || "",
        preferredArea: districtQueryHints[(locationEl?.value || "").trim()] || "",
        maxDistanceKm: Number(distEl?.value || 0),
        maxRent: Number(priceEl?.value || 0),
        housingType: selectedType,
        body: requestText,
        createdAt: serverTimestamp(),
        status: "new"
      });
      const ok = document.createElement("div");
      ok.className = "alert alert-success";
      ok.textContent = "Request saved. We will contact you soon.";
      form.prepend(ok);
      setTimeout(() => ok.remove(), 2500);
      form.reset();
    } catch {
      window.location.href = `mailto:${HOUSING_REQUEST_EMAIL}?subject=${subject}&body=${body}`;
    }
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
initLoginPage();
initRegisterPage();
initDashboardPage();
initAdminPage();
initDocumentsTracker();
initMapPage();
initUniversityMessaging();
initUniversityAdmin();
initHousingFinder();
