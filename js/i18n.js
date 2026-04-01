export const I18N = {
  en: {
    title: "StudySettle Baku",
    subtitle: "Your student relocation helper for Baku"
  },
  az: {
    title: "StudySettle Bakı",
    subtitle: "Bakı üçün tələbə köç dəstəyi"
  },
  ru: {
    title: "StudySettle Баку",
    subtitle: "Помощь студентам с переездом в Баку"
  }
};

export function getLang() {
  return localStorage.getItem("lang") || "en";
}
export function setLang(lang) {
  localStorage.setItem("lang", lang);
}