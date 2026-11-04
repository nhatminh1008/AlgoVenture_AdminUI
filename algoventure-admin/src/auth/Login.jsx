import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "./AuthContext";
import { loginDestination, roleHome } from "./routing";
import "./Login.css";
import BrandMark from "../components/BrandMark";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const account = await login(email, password);
      navigate(loginDestination(account.role, location.state?.from), {
        replace: true,
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <div className="login-brand-lockup"><BrandMark className="login-logo" /><span>AlgoVenture's</span></div>
          <div className="login-portal-label">Web Portal</div>
        </div>
      </header>
      <section className="login-form-panel" aria-labelledby="login-title">
        <h1 id="login-title">Đăng nhập</h1>
          <form onSubmit={submit} className="login-form">
            <label className="block">
              <span className="field-label">Email</span>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" size={18} aria-hidden="true" />
                <input
                type="email"
                name="email"
                autoComplete="username"
                className="field login-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@algoventure.edu"
              />
              </div>
            </label>
            <div>
              <label htmlFor="password" className="field-label">Mật khẩu</label>
              <div className="login-input-wrap">
                <LockKeyhole className="login-input-icon" size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  className="field login-input login-password-input"
                  required
                  value={password}
                  placeholder="Nhập mật khẩu của bạn"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="login-password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="login-submit"
            >
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
      </section>
      <footer className="login-page-footer">© {new Date().getFullYear()} AlgoVenture</footer>
    </main>
  );
}
