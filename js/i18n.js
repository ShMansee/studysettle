export const I18N = {
  en: {
    title: "StudySettle Baku",
    subtitle: "Your student relocation helper for Baku",
    nav_home: "Home",
    nav_documents: "Documents",
    nav_housing: "Housing",
    nav_explore: "Explore",
    nav_essentials: "Essentials",
    nav_login: "Login",
    nav_register: "Register",
    nav_dashboard: "Dashboard",
    nav_admin: "Admin"
  },
  az: {
    title: "StudySettle Bakı",
    subtitle: "Bakı üçün tələbə köç dəstəyi",
    nav_home: "Ana səhifə",
    nav_documents: "Sənədlər",
    nav_housing: "Yaşayış",
    nav_explore: "Kəşf et",
    nav_essentials: "Əsaslar",
    nav_login: "Giriş",
    nav_register: "Qeydiyyat",
    nav_dashboard: "Panel",
    nav_admin: "Admin"
  },
  ru: {
    title: "StudySettle Баку",
    subtitle: "Помощь студентам с переездом в Баку",
    nav_home: "Главная",
    nav_documents: "Документы",
    nav_housing: "Жильё",
    nav_explore: "Город",
    nav_essentials: "Важно",
    nav_login: "Вход",
    nav_register: "Регистрация",
    nav_dashboard: "Кабинет",
    nav_admin: "Админ"
  }
};

const LANG_KEY = "lang";

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function getLang() {
  return localStorage.getItem(LANG_KEY) || "en";
}

export function t(key, lang = getLang()) {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

export function applyTranslations(lang = getLang()) {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key, lang);
  });
}
