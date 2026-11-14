import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import BrandMark from "../shared/components/BrandMark";
import { usePreferences, useText } from "../preferences/preferencesContext";
import LoginArtwork from "./LoginArtwork";
import "./LoginPage.css";

const languages = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export default function AuthLayout({ title, heading = title, children, backToLogin = false }) {
  const { language, setLanguage } = usePreferences();
  const text = useText();
  useEffect(() => { document.title = title; }, [title]);

  return (
    <main className="login-page">
      <div className="login-language" role="group" aria-label={text("Ngôn ngữ", "Language")}>
        <Globe size={17} aria-hidden="true" />
        {languages.map(({ value, label }) => (
          <button key={value} type="button" lang={value} aria-pressed={language === value}
            onClick={() => setLanguage(value)}>{label}</button>
        ))}
      </div>
      <section className="login-access" aria-labelledby="login-title">
        <LoginArtwork />
        <div className="login-form-panel">
          <BrandMark className="login-logo" />
          <h1 id="login-title">{heading}</h1>
          {children}
          {backToLogin && (
            <Link to="/login" className="login-link login-back">
              <ArrowLeft size={16} aria-hidden="true" />{text("Về trang đăng nhập", "Back to sign in")}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
