import { useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, DEFAULT_THEME, STORAGE_KEYS } from "../constants/app.constants";

export function usePersistedSettings() {
  const [language, setLanguage] = useState(
    () => localStorage.getItem(STORAGE_KEYS.language) || DEFAULT_LANGUAGE,
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEYS.theme) || DEFAULT_THEME,
  );
  const [syncPreviewScroll, setSyncPreviewScroll] = useState(
    () => localStorage.getItem(STORAGE_KEYS.syncPreviewScroll) === "true",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.syncPreviewScroll,
      String(syncPreviewScroll),
    );
  }, [syncPreviewScroll]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return {
    language,
    setLanguage,
    theme,
    setTheme,
    toggleTheme,
    syncPreviewScroll,
    setSyncPreviewScroll,
  };
}
