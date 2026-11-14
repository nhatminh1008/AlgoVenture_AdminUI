import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../../api/apiClient";
import { useAuth } from "../../auth/useAuth";
import { roleHome } from "../../auth/authRoutes";
import { useApiData } from "../../shared/hooks/useApiData";
import { ApiFeedback } from "../../shared/components/ApiFeedback";
import Appearance from "../../preferences/Appearance";
import { useText } from "../../preferences/preferencesContext";

const load = () => api("/profile");
const personalFields = [
  ["name", "Họ tên", "Full name", "text", 100, true],
  ["email", "Email", "Email", "email", 254, true],
  ["dateOfBirth", "Ngày sinh", "Date of birth", "date"],
  ["phone", "Số điện thoại", "Phone", "tel", 20],
  ["address", "Địa chỉ", "Address", "text", 255],
];
const displayNameField = ["displayName", "Tên hiển thị trong game", "Game display name", "text", 24];

export default function ProfilePage() {
  const { user, logout, updateSessionProfile } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <ProfileForm key={user.id} user={user} logout={logout} onSaved={updateSessionProfile} />;
}

function ProfileForm({ user, logout, onSaved }) {
  const text = useText();
  const state = useApiData(load, null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const form = state.data && { ...state.data, ...draft };
  const fields = user.role === "learner" ? [...personalFields, displayNameField] : personalFields;
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body = Object.fromEntries(fields.map(([key]) => [key, form[key]?.trim() || null]));
      const updated = await api("/profile", { method: "PUT", body });
      if (await onSaved(updated)) {
        state.setData(updated);
        setDraft({});
        setMessage(text("Đã lưu hồ sơ cá nhân.", "Profile saved."));
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{text("Hồ sơ của tôi", "My profile")}</h1>
      <div className="flex gap-2">{user.role !== "learner" && <Link className="btn-secondary" to={roleHome(user.role)}>{text("Về trang chính", "Back to home")}</Link>}
        <button type="button" className="btn-secondary" onClick={logout}>{text("Đăng xuất", "Sign out")}</button></div>
    </header>
    <ApiFeedback state={state} message={message} actionError={text(error)} />
    {form && <form onSubmit={save} className="panel space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, vi, en, type, maxLength, required]) => <label key={key}>
        <span className="field-label">{text(vi, en)}</span>
        <input className="field" type={type} maxLength={maxLength} required={required} value={form[key] ?? ""}
          onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
      </label>)}</div>
      <p className="text-sm">{text("Nếu đổi email, bạn cần đăng nhập lại bằng email mới.", "After changing your email, sign in again with the new address.")}</p>
      <button className="btn-primary" disabled={saving}>{saving ? text("Đang lưu…", "Saving…") : text("Lưu hồ sơ", "Save profile")}</button>
    </form>}
    <Appearance />
  </main>;
}
