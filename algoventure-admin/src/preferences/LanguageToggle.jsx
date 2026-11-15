import { usePreferences, useText } from "./preferencesContext";

const languages = [
  { value: "vi", short: "VN", label: "Tiếng Việt" },
  { value: "en", short: "EN", label: "English" },
];

export default function LanguageToggle({ fullLabels = false }) {
  const { language, setLanguage } = usePreferences();
  const text = useText();
  return <div className="preference-toggle language-toggle" data-language={language} role="group" aria-label={text("Ngôn ngữ", "Language")}>
    {languages.map(({ value, short, label }) => <button key={value} type="button" aria-pressed={language === value}
      aria-label={label} lang={value}
      onClick={() => setLanguage(value)}>{fullLabels ? label : short}</button>)}
  </div>;
}
