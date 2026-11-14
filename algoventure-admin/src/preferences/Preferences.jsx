import { useEffect, useState } from "react";
import { PreferencesContext } from "./preferencesContext";

export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("portal.language") === "en" ? "en" : "vi");
  const [theme, setTheme] = useState(() => localStorage.getItem("portal.theme") === "dark" ? "dark" : "light");
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("portal.language", language);
    localStorage.setItem("portal.theme", theme);
  }, [language, theme]);
  return <PreferencesContext.Provider value={{ language, setLanguage, theme, setTheme }}>{children}</PreferencesContext.Provider>;
}
