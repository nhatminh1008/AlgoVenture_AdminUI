import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Globe, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "./useAuth";
import { loginDestination } from "./authRoutes";
import "./LoginPage.css";
import BrandMark from "../shared/components/BrandMark";
import LoginArtwork from "./LoginArtwork";
import { usePreferences, useText } from "../preferences/preferencesContext";

const portalTitle = "AlgoVenture's Web Portal";
const loginLanguages = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export default function LoginPage() {
  const { user, login, sessionNotice, clearSessionNotice } = useAuth();
  const location = useLocation();
  const { language, setLanguage } = usePreferences();
  const text = useText();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageTitle = text("Đăng nhập");
  useEffect(() => { document.title = pageTitle; }, [pageTitle]);
  if (user) return <Navigate to={loginDestination(user.role, location.state?.from)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    clearSessionNotice();
    try {
      await login(email, password);
    } catch (failure) { setError(failure.message); }
    finally { setIsSubmitting(false); }
  }
  return (
    <main className="login-page">
      <div className="login-language" role="group" aria-label={text("Ngôn ngữ", "Language")}>
        <Globe size={17} aria-hidden="true" />
        {loginLanguages.map(({ value, label }) => (
          <button key={value} type="button" lang={value} aria-pressed={language === value}
            onClick={() => setLanguage(value)}>{label}</button>
        ))}
      </div>
      <section className="login-access" aria-labelledby="login-title">
        <LoginArtwork />
        <div className="login-form-panel">
          <BrandMark className="login-logo" />
          <h1 id="login-title">{portalTitle}</h1>
          <form onSubmit={submit} className="login-form" aria-labelledby="login-title" aria-busy={isSubmitting}>
            <label><span className="field-label">{text("Địa chỉ email")}</span><div className="login-input-wrap"><Mail size={18} aria-hidden="true" /><input type="email" name="email" autoComplete="username" className="field" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@algoventure.edu" /></div></label>
            <div><label htmlFor="password" className="field-label">{text("Mật khẩu")}</label><div className="login-input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" className="field" required value={password} placeholder={text("Nhập mật khẩu")} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? text("Ẩn mật khẩu") : text("Hiện mật khẩu")} aria-pressed={showPassword} aria-controls="password" className="login-password-toggle">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            {(error || sessionNotice) && <p role="alert" className="login-error">{text(error || sessionNotice)}</p>}
            <button type="submit" disabled={isSubmitting} className="login-submit"><span>{isSubmitting ? text("Đang đăng nhập…") : text("Đăng nhập")}</span><ArrowRight size={18} aria-hidden="true" /></button>
          </form>
        </div>
      </section>
    </main>
  );
}
