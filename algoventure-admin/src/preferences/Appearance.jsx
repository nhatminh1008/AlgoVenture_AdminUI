import LanguageToggle from "./LanguageToggle";
import { usePreferences, useText } from "./preferencesContext";

export default function Appearance() {
  const { theme, setTheme } = usePreferences();
  const text = useText();
  const colorLabel = text("Chế độ màu", "Color mode");
  const colorToggle = (
    <div className="preference-toggle" role="group" aria-label={colorLabel}>
      <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
        {text("Sáng", "Light")}
      </button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
        {text("Tối", "Dark")}
      </button>
    </div>
  );

  return <section className="panel space-y-4 p-6">
    <h2 className="text-lg font-semibold">{text("Giao diện cá nhân", "Appearance")}</h2>
    <div className="flex items-center justify-between gap-3">
      <span>{colorLabel}</span>
      {colorToggle}
    </div>
    <div className="flex items-center justify-between gap-3"><span>{text("Ngôn ngữ", "Language")}</span><LanguageToggle /></div>
  </section>;
}
