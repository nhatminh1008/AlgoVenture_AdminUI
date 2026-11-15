import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import BrandMark from "../shared/components/BrandMark";
import { useText } from "../preferences/preferencesContext";
import LanguageToggle from "../preferences/LanguageToggle";
import LoginArtwork from "./LoginArtwork";
import "./LoginPage.css";

export default function AuthLayout({ title, heading = title, children, backToLogin = false }) {
  const text = useText();
  useEffect(() => { document.title = title; }, [title]);

  return (
    <main className="login-page">
      <div className="login-language">
        <Globe size={17} aria-hidden="true" />
        <LanguageToggle fullLabels />
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
