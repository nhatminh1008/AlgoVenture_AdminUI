import { useEffect, useRef, useState } from "react";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "./authService";
import BrandMark from "../shared/components/BrandMark";
import { AuthSessionContext } from "./AuthSessionContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pendingLogout = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let sessionExpired = false;
    const expired = () => {
      sessionExpired = true;
      setUser(null);
    };
    window.addEventListener("auth-expired", expired);
    getCurrentUser()
      .then((account) => {
        if (!cancelled && !sessionExpired) setUser(account);
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
  async function login(email, password) {
    await pendingLogout.current;
    const account = await loginRequest(email, password);
    setError("");
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
      setError("Đã cập nhật email. Vui lòng đăng nhập lại bằng email mới.");
      return false;
    }
    setUser((current) => current?.id === profile.id ? profile : current);
    return true;
  }
  if (loading)
    return (
      <div className="app-loading"><BrandMark /><p role="status"><span className="loading-dot" />Đang kiểm tra đăng nhập…</p></div>
    );
  return (
    <AuthSessionContext.Provider value={{ user, login, logout, updateSessionProfile }}>
      {error && (
        <p role="alert" className="bg-red-50 p-4 text-red-700">
          {error}{" "}
          <button onClick={() => setError("")} className="underline">
            Đóng
          </button>
        </p>
      )}
      {children}
    </AuthSessionContext.Provider>
  );
}
