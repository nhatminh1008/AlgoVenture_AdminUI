import { Globe, Moon, SlidersHorizontal, Sun } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { usePreferences, useText } from "./preferencesContext";

export default function Appearance({ detailed = false }) {
  const { theme, setTheme } = usePreferences();
  const text = useText();
  const colorLabel = text("Chế độ màu", "Color mode");
  const colorToggle = (
    <div className="preference-toggle" role="group" aria-label={colorLabel}>
      <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
        {detailed && <Sun size={16} aria-hidden="true" />}{text("Sáng", "Light")}
      </button>
      <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
        {detailed && <Moon size={16} aria-hidden="true" />}{text("Tối", "Dark")}
      </button>
    </div>
  );

  if (detailed) {
    return (
      <section className="panel profile-card" aria-labelledby="profile-appearance-heading">
        <div className="profile-card-heading">
          <span className="profile-section-icon"><SlidersHorizontal size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="profile-appearance-heading">{text("Giao diện cá nhân", "Appearance")}</h2>
            <p>{text("Cài đặt cách hiển thị của portal.", "Customize how the portal looks.")}</p>
          </div>
        </div>
        <div className="profile-preferences">
          <div className="profile-preference">
            <h3><Sun size={16} aria-hidden="true" />{colorLabel}</h3>
            {colorToggle}
          </div>
          <div className="profile-preference">
            <h3><Globe size={16} aria-hidden="true" />{text("Ngôn ngữ", "Language")}</h3>
            <LanguageToggle fullLabels />
          </div>
        </div>
      </section>
    );
  }

  return <section className="panel space-y-4 p-6">
    <h2 className="text-lg font-semibold">{text("Giao diện cá nhân", "Appearance")}</h2>
    <div className="flex items-center justify-between gap-3">
      <span>{colorLabel}</span>
      {colorToggle}
    </div>
    <div className="flex items-center justify-between gap-3"><span>{text("Ngôn ngữ", "Language")}</span><LanguageToggle /></div>
  </section>;
}
