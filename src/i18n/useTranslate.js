import { TRANSLATIONS } from "./translations";

// Returns a translate(key) function bound to the given language.
// Kept as a plain function (not memoized) to match the original
// App.jsx behavior, where `translate` was recomputed on every render.
export function useTranslate(language) {
  return function translate(key) {
    return TRANSLATIONS[language][key] || key;
  };
}
