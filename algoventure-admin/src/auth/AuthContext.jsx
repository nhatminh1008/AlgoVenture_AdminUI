import { useText } from "../preferences/preferencesContext";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "./authService";
import BrandMark from "../shared/components/BrandMark";
import { api } from "../api/apiClient";
import { AuthSessionContext } from "./AuthSessionContext";

const portalAccessDenied = "Tài khoản của bạn không có quyền truy cập trang này.";
const hasPortalAccess = (account) => ["admin", "instructor"].includes(account?.role);

export function AuthProvider({ children }) {
  const text = useText();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const pendingLogout = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let sessionExpired = false;
    const expired = (event) => {
      sessionExpired = true;
      setUser(null);
      if (event.detail) setSessionNotice(event.detail);
    };
    window.addEventListener("auth-expired", expired);
    getCurrentUser()
      .then((account) => {
        if (cancelled || sessionExpired) return;
        if (!hasPortalAccess(account)) {
          setSessionNotice(portalAccessDenied);
          return;
        }
        setUser(account);
      })
      .catch((failure) => {
        if (!cancelled && !sessionExpired && failure.status !== 401) {
          setError(failure.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      window.removeEventListener("auth-expired", expired);
    };
  }, []);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let checking = false;
    async function checkSession() {
      if (document.hidden || checking || pendingLogout.current) return;
      checking = true;
      try {
        await getCurrentUser();
      } catch {
        // apiClient handles expired sessions. Retry transient failures on the next check.
      } finally {
        checking = false;
      }
    }
    const timer = window.setInterval(checkSession, 15000);
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", checkSession);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [userId]);

  async function login(email, password) {
    await pendingLogout.current;
    const account = await loginRequest(email, password);
    if (!hasPortalAccess(account)) {
      await logoutRequest().catch(() => {});
      throw new Error(portalAccessDenied);
    }
    setError("");
    setSessionNotice("");
    setUser(account);
    return account;
  }
  function logout() {
    if (!pendingLogout.current) {
      setError("");
      pendingLogout.current = logoutRequest()
        .then(() => setUser(null))
        .catch((failure) => setError(failure.message))
        .finally(() => { pendingLogout.current = null; });
    }
    return pendingLogout.current;
  }
  async function updateSessionProfile(profile) {
    if (profile.id !== user?.id) return false;
    if (profile.email !== user.email) {
      await logout();
      setUser((current) => current?.id === profile.id ? null : current);
      setSessionNotice("Đã cập nhật email. Vui lòng đăng nhập lại bằng email mới.");
      return false;
    }
    setUser((current) => current?.id === profile.id ? profile : current);
    return true;
  }
  async function changePassword(currentPassword, newPassword) {
    await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
    setError("");
    setSessionNotice("Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.");
    setUser(null);
  }
  if (loading)
    return (
      <div className="app-loading"><BrandMark /><p role="status"><span className="loading-dot" />{text("Đang kiểm tra đăng nhập…")}</p></div>
    );
  return (
    <AuthSessionContext.Provider value={{ user, login, logout, updateSessionProfile, changePassword, sessionNotice,
      clearSessionNotice: () => setSessionNotice("") }}>
      {error && (
        <p role="alert" className="bg-red-50 p-4 text-red-700">
          {error}{" "}
          <button onClick={() => setError("")} className="underline">
            {text("Đóng")}
          </button>
        </p>
      )}
      {children}
    </AuthSessionContext.Provider>
  );
}
