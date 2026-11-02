import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Braces, Eye, EyeOff, GitBranch, LockKeyhole, Mail, Sparkles } from "lucide-react";
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
      <div className="login-shell">
        <aside className="login-story" aria-labelledby="login-story-title">
          <div className="login-story-kicker"><span /> KHÁM PHÁ. KẾT NỐI. PHÁT TRIỂN.</div>
          <div className="login-story-copy">
            <h2 id="login-story-title">Mỗi ý tưởng.<br />Một hành trình <em>mới.</em></h2>
            <p>Cùng AlgoVenture kiến tạo những trải nghiệm học tập đầy cảm hứng.</p>
          </div>
          <div className="login-journey" aria-hidden="true">
            <div className="login-orbit login-orbit-outer" />
            <div className="login-orbit login-orbit-inner" />
            <svg className="login-journey-lines" viewBox="0 0 400 280" fill="none">
              <path d="M70 180V120Q70 100 90 100H180Q200 100 200 80V50M200 80V165Q200 185 220 185H330M200 130H290Q310 130 310 110V90" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" />
            </svg>
            <div className="login-node login-node-code"><Braces size={28} /></div>
            <div className="login-node login-node-branch"><GitBranch size={29} /></div>
            <div className="login-node login-node-spark"><Sparkles size={24} /></div>
            <div className="login-code-card"><span className="login-code-dots"><i /><i /><i /></span><code><span>while</span> (curiosity) {'{'}<br />&nbsp; learn();<br />&nbsp; grow();<br />{'}'}</code></div>
            <div className="login-journey-tag"><span /> Bắt đầu từ sự tò mò</div>
          </div>
          <div className="login-story-footer"><span className="login-footer-line" /> NƠI TRI THỨC MỞ RA CƠ HỘI</div>
        </aside>
        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-brand">
            <div className="login-brand-lockup">
              <BrandMark className="login-logo" />
              <span>Algo<span className="login-brand-accent">Venture</span><span className="login-brand-possessive">'s</span></span>
            </div>
            <div className="login-portal-label"><span /> Web Portal <span /></div>
          </div>
          <div className="login-form-heading">
            <h1 id="login-title">Đăng nhập</h1>
          </div>
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
      </div>
      <footer className="login-page-footer">© {new Date().getFullYear()} AlgoVenture <span>·</span> Khơi nguồn tư duy, mở lối tương lai.</footer>
    </main>
  );
}
