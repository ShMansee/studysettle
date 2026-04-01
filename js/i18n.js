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
    nav_admin: "Admin",
    hero_title: "Your Student Relocation Guide for Baku",
    hero_subtitle: "Everything you need to settle in Baku as an international student — documents, housing, transport, and more.",
    hero_cta: "Explore Guides",
    feat_documents: "Documents",
    feat_documents_desc: "Visa, residence permit, registration — step-by-step checklist for every document you need.",
    feat_housing: "Housing",
    feat_housing_desc: "Find the right neighbourhood, avoid scams, and get fair price estimates for Baku apartments.",
    feat_explore: "Explore Baku",
    feat_explore_desc: "Metro, buses, SIM cards, banks — learn how to navigate city life from day one.",
    feat_essentials: "Essentials",
    feat_essentials_desc: "Emergency numbers, cost of living estimates, and useful apps for everyday life.",
    lbl_email: "Email address",
    lbl_password: "Password",
    lbl_name: "Full name",
    lbl_university: "University",
    lbl_confirm_password: "Confirm password",
    btn_login: "Sign In",
    btn_register: "Create Account",
    btn_logout: "Log Out",
    link_no_account: "Don't have an account?",
    link_have_account: "Already have an account?",
    link_register: "Register",
    link_login: "Login",
    placeholder_firebase: "Firebase authentication will be added soon."
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
    nav_admin: "Admin",
    hero_title: "Bakıda Tələbə Köçü üçün Bələdçiniz",
    hero_subtitle: "Xarici tələbə kimi Bakıda yerləşmək üçün lazım olan hər şey — sənədlər, mənzil, nəqliyyat və daha çox.",
    hero_cta: "Bələdçilərə Bax",
    feat_documents: "Sənədlər",
    feat_documents_desc: "Viza, müvəqqəti yaşayış icazəsi, qeydiyyat — lazımlı hər sənəd üçün addım-addım yoxlama siyahısı.",
    feat_housing: "Yaşayış",
    feat_housing_desc: "Düzgün məhəlləni tapın, fırıldaqçılıqdan qaçın və Bakı mənzilləri üçün qiymət qiymətləndirmələri əldə edin.",
    feat_explore: "Bakını Kəşf Et",
    feat_explore_desc: "Metro, avtobuslar, SIM kartlar, banklar — ilk gündən şəhər həyatını necə idarə edəcəyinizi öyrənin.",
    feat_essentials: "Əsaslar",
    feat_essentials_desc: "Fövqəladə hallar üçün nömrələr, yaşayış xərcləri və gündəlik həyat üçün faydalı tətbiqlər.",
    lbl_email: "E-poçt ünvanı",
    lbl_password: "Şifrə",
    lbl_name: "Ad Soyad",
    lbl_university: "Universitet",
    lbl_confirm_password: "Şifrəni təsdiqləyin",
    btn_login: "Daxil ol",
    btn_register: "Hesab yarat",
    btn_logout: "Çıxış",
    link_no_account: "Hesabınız yoxdur?",
    link_have_account: "Artıq hesabınız var?",
    link_register: "Qeydiyyat",
    link_login: "Giriş",
    placeholder_firebase: "Firebase autentifikasiyası tezliklə əlavə ediləcək."
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
    nav_admin: "Админ",
    hero_title: "Ваш путеводитель по переезду в Баку",
    hero_subtitle: "Всё необходимое для переезда в Баку в качестве иностранного студента — документы, жильё, транспорт и многое другое.",
    hero_cta: "Смотреть гиды",
    feat_documents: "Документы",
    feat_documents_desc: "Виза, вид на жительство, регистрация — пошаговый чеклист для каждого документа.",
    feat_housing: "Жильё",
    feat_housing_desc: "Найдите подходящий район, избегайте мошенников и узнайте справедливые цены на квартиры в Баку.",
    feat_explore: "Исследуй Баку",
    feat_explore_desc: "Метро, автобусы, SIM-карты, банки — узнайте, как ориентироваться в городе с первого дня.",
    feat_essentials: "Важно",
    feat_essentials_desc: "Телефоны экстренных служб, оценки стоимости жизни и полезные приложения для повседневной жизни.",
    lbl_email: "Адрес электронной почты",
    lbl_password: "Пароль",
    lbl_name: "Полное имя",
    lbl_university: "Университет",
    lbl_confirm_password: "Подтвердите пароль",
    btn_login: "Войти",
    btn_register: "Создать аккаунт",
    btn_logout: "Выйти",
    link_no_account: "Нет аккаунта?",
    link_have_account: "Уже есть аккаунт?",
    link_register: "Регистрация",
    link_login: "Войти",
    placeholder_firebase: "Аутентификация Firebase будет добавлена в ближайшее время."
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
