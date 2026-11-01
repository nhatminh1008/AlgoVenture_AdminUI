import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";
import { loginDestination, roleHome } from "./routing";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-5">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="rounded-xl bg-emerald-600 p-3 text-white">
            <BookOpen size={26} />
          </span>
          <span className="text-2xl font-bold text-slate-900">AlgoVenture</span>
        </div>
        <section className="panel p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">
            Sử dụng tài khoản Admin hoặc Instructor để vào không gian làm việc
            của bạn.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="field-label">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                className="field"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@algoventure.edu"
              />
            </label>
            <label className="block">
              <span className="field-label">Mật khẩu</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="field"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
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
              className="btn-primary w-full"
            >
              <LogIn size={18} />
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
        </section>
        <p className="mt-5 text-center text-sm text-slate-500">
          Sử dụng tài khoản do quản trị viên cung cấp.
        </p>
      </div>
    </main>
  );
}
