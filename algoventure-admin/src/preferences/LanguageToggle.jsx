import { usePreferences, useText } from "./preferencesContext";

export default function LanguageToggle() {
  const { language, setLanguage } = usePreferences();
  const text = useText();
  return <div className="preference-toggle" role="group" aria-label={text("Ngôn ngữ", "Language")}>
    {["vi", "en"].map((value) => <button key={value} type="button" aria-pressed={language === value}
      onClick={() => setLanguage(value)}>{value === "vi" ? "VN" : "EN"}</button>)}
  </div>;
}
