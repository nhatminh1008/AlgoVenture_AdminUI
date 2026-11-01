import { createContext, useContext, useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { roleHome } from "./routing";
import { api } from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const expired = () => setUser(null);
    window.addEventListener("auth-expired", expired);
    api("/auth/me")
      .then((account) => {
        if (!cancelled) setUser(account);
      })
      .catch((failure) => {
        if (!cancelled && failure.status !== 401) setError(failure.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      window.removeEventListener("auth-expired", expired);
    };
  }, []);
  async function login(email, password) {
    const account = await api("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
    });
    setUser(account);
    return account;
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (failure) {
      setError(failure.message);
    }
  }
  if (loading)
    return (
      <p role="status" className="p-8">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {error && (
        <p role="alert" className="bg-red-50 p-4 text-red-700">
          {error}{" "}
          <button onClick={() => setError("")} className="underline">
            Đóng
          </button>
        </p>
      )}
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
export function RequireRole({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!["admin", "instructor"].includes(user.role)) return <LearnerNotice />;
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}
function LearnerNotice() {
  const { logout } = useAuth();
  return (
    <div className="p-8">
      <p>
        Tài khoản Learner sử dụng ứng dụng học tập. Web này dành cho Admin và
        Instructor.
      </p>
      <button className="btn-secondary mt-4" onClick={logout}>
        Đăng xuất
      </button>
    </div>
  );
}
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}
