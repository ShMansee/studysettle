import { applyTranslations, getLang, setLang } from "./i18n.js";

function wireLanguageButtons() {
  const en = document.getElementById("lang-en");
  const az = document.getElementById("lang-az");
  const ru = document.getElementById("lang-ru");

  en && en.addEventListener("click", () => { setLang("en"); applyTranslations("en"); });
  az && az.addEventListener("click", () => { setLang("az"); applyTranslations("az"); });
  ru && ru.addEventListener("click", () => { setLang("ru"); applyTranslations("ru"); });
}

wireLanguageButtons();
applyTranslations(getLang());