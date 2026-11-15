import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Globe, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "./useAuth";
import { loginDestination } from "./authRoutes";
import { getGoogleLoginStatus, startGoogleLogin } from "./authService";
import googleLogo from "./google-sign-in.png";
import "./LoginPage.css";
import BrandMark from "../shared/components/BrandMark";
import LoginArtwork from "./LoginArtwork";
import { useText } from "../preferences/preferencesContext";
import LanguageToggle from "../preferences/LanguageToggle";

const portalTitle = "AlgoVenture's Web Portal";

export default function LoginPage() {
  const { user, login, sessionNotice, clearSessionNotice } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const text = useText();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [isStartingGoogle, setIsStartingGoogle] = useState(false);
  const googleFailed = new URLSearchParams(location.search).get("google") === "failed";
  const googleFailure = googleFailed && text(
    "Đăng nhập Google không thành công. Hãy chọn đúng email của tài khoản AlgoVenture và thử lại.",
    "Google sign-in failed. Select the email on your AlgoVenture account and try again.",
  );
  const busy = isSubmitting || isStartingGoogle;
  const pageTitle = text("Đăng nhập");
  useEffect(() => { document.title = pageTitle; }, [pageTitle]);
  useEffect(() => {
    if (user) return;
    let mounted = true;
    getGoogleLoginStatus().then(({ enabled }) => {
      if (mounted) setGoogleEnabled(enabled === true);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  if (user) return <Navigate to={loginDestination(user.role, location.state?.from)} replace />;
  function clearLoginErrors() {
    setError("");
    clearSessionNotice();
    if (googleFailed) navigate("/login", { replace: true, state: location.state });
  }

  async function loginWithGoogle() {
    if (busy) return;
    setIsStartingGoogle(true);
    clearLoginErrors();
    try {
      const { url } = await startGoogleLogin();
      const authorization = new URL(url);
      if (authorization.origin !== "https://accounts.google.com" || authorization.pathname !== "/o/oauth2/v2/auth") {
        throw new Error("Không mở được trang đăng nhập Google.");
      }
      window.location.assign(authorization.href);
    } catch (failure) {
      setError(failure.message);
      setIsStartingGoogle(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setIsSubmitting(true);
    clearLoginErrors();
    try {
      await login(identifier, password);
    } catch (failure) { setError(failure.message); }
    finally { setIsSubmitting(false); }
  }
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
          <h1 id="login-title">{portalTitle}</h1>
          <form onSubmit={submit} className="login-form" aria-labelledby="login-title" aria-busy={busy}>
            <label><span className="field-label">{text("Email hoặc tên đăng nhập", "Email or username")}</span><div className="login-input-wrap"><Mail size={18} aria-hidden="true" /><input type="text" name="identifier" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={254} className="field" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></div></label>
            <div><label htmlFor="password" className="field-label">{text("Mật khẩu")}</label><div className="login-input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" className="field" required value={password} placeholder={text("Nhập mật khẩu")} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? text("Ẩn mật khẩu") : text("Hiện mật khẩu")} aria-pressed={showPassword} aria-controls="password" className="login-password-toggle">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            {(error || sessionNotice || googleFailure) && <p role="alert" className="login-error">{error || sessionNotice ? text(error || sessionNotice) : googleFailure}</p>}
            <button type="submit" disabled={busy} className="login-submit"><span>{isSubmitting ? text("Đang đăng nhập…") : text("Đăng nhập")}</span><ArrowRight size={18} aria-hidden="true" /></button>
            {googleEnabled && <button type="button" className="google-sign-in" onClick={loginWithGoogle} disabled={busy}>
              <img src={googleLogo} width="18" height="18" alt="" />
              {isStartingGoogle ? text("Đang mở Google…", "Opening Google…") : text("Đăng nhập bằng Google", "Sign in with Google")}
            </button>}
          </form>
          <div className="login-auth-links">
            <Link className="login-link" to="/register">{text("Tạo tài khoản", "Create an account")}</Link>
            <Link className="login-link" to="/forgot-password">{text("Quên mật khẩu?", "Forgot password?")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
