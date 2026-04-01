import { getLang, setLang } from "./i18n.js";

function wireLanguageButtons() {
  const en = document.getElementById("lang-en");
  const az = document.getElementById("lang-az");
  const ru = document.getElementById("lang-ru");

  en && en.addEventListener("click", () => { setLang("en"); location.reload(); });
  az && az.addEventListener("click", () => { setLang("az"); location.reload(); });
  ru && ru.addEventListener("click", () => { setLang("ru"); location.reload(); });

  document.documentElement.lang = getLang();
}

wireLanguageButtons();