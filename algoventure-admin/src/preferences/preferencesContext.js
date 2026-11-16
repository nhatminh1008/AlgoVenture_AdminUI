import { createContext, useContext } from "react";
import { english } from "./english";
export const PreferencesContext = createContext({ language: "vi", theme: "light" });
export const usePreferences = () => useContext(PreferencesContext);
export const useLocale = () => usePreferences().language === "en" ? "en-US" : "vi-VN";
export function useText() {
  const { language } = usePreferences();
  return (vi, en = Object.hasOwn(english, vi) ? english[vi] : undefined) => language === "en" ? en || vi : vi;
}
