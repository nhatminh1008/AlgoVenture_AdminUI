import { usePreferences, useText } from "./preferencesContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, setTheme } = usePreferences();
  const text = useText();
  const dark = theme === "dark";
  return (
    <button type="button" className="portal-theme-toggle" role="switch" aria-checked={dark}
      aria-label={text("Chế độ tối", "Dark mode")}
      onClick={() => setTheme(dark ? "light" : "dark")}>
      <span className="theme-switch-sky" aria-hidden="true">
        <span className="theme-switch-clouds" />
        <span className="theme-switch-stars" />
        <span className="theme-switch-thumb">
          <span className="theme-switch-moon" />
        </span>
      </span>
    </button>
  );
}
