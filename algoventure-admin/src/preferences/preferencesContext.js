import { createContext, useContext } from "react";
import { english } from "./english";
export const PreferencesContext = createContext({ language: "vi", theme: "light" });
export const usePreferences = () => useContext(PreferencesContext);
export function useText() {
  const { language } = usePreferences();
  return (vi, en = english[vi]) => language === "en" ? en || vi : vi;
}
