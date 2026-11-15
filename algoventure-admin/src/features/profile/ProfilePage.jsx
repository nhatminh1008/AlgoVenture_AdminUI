import { useState } from "react";
import { CircleCheck, Info, KeyRound, Save, UserRound } from "lucide-react";
import { saveMyProfile as saveAdminProfile } from "../admin/users/userService";
import { api } from "../../api/apiClient";
import { useAuth } from "../../auth/useAuth";
import { resetPasswordErrors, usernameError } from "../../auth/authValidation";
import { useApiData } from "../../shared/hooks/useApiData";
import { ApiFeedback } from "../../shared/components/ApiFeedback";
import { useText } from "../../preferences/preferencesContext";
import "./ProfilePage.css";

const load = () => api("/profile");
const personalFields = [
  ["name", "Họ tên", "Full name", "text", "name", 100, true],
  ["email", "Email", "Email", "email", "email", 254, true],
  ["username", "Tên đăng nhập", "Username", "text", "username", 30],
  ["dateOfBirth", "Ngày sinh", "Date of birth", "date", "bday"],
  ["phone", "Số điện thoại", "Phone", "tel", "tel", 20],
  ["address", "Địa chỉ", "Address", "text", "street-address", 255],
];
const displayNameField = ["displayName", "Tên hiển thị trong game", "Game display name", "text", "nickname", 24];
const roleLabels = { admin: "Quản trị viên", instructor: "Giảng viên", learner: "Học viên" };

export default function ProfilePage() {
  const { user, updateSessionProfile, changePassword } = useAuth();
  return <ProfileForm key={user.id} user={user} onSaved={updateSessionProfile} onPasswordChange={changePassword} />;
}

function ProfileForm({ user, onSaved, onPasswordChange }) {
  const text = useText();
  const state = useApiData(load, null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const form = state.data && { ...state.data, ...draft };
  const fields = user.role === "learner" ? [...personalFields, displayNameField] : personalFields;
  const account = state.data ?? user;
  const initials = account.name?.trim().split(/\s+/).slice(-2).map((part) => [...part][0]).join("") || "AV";
  const readOnlyEmail = user.role === "admin";
  const changed = form && fields.some(([key]) => (!readOnlyEmail || key !== "email") && (form[key]?.trim() || null) !== (state.data[key]?.trim() || null));

  async function save(event) {
    event.preventDefault();
    if (!changed || saving) return;
    const invalidUsername = form.username?.trim() && usernameError(form.username);
    if (invalidUsername) {
      setError(invalidUsername);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const body = Object.fromEntries(fields.map(([key]) => [key, form[key]?.trim() || null]));
      const updated = await (readOnlyEmail ? saveAdminProfile(body) : api("/profile", { method: "PUT", body }));
      if (await onSaved(updated)) {
        state.setData(updated);
        setDraft({});
        setSaved(true);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="profile-page">
      <div className="page-heading profile-heading">
        <h1>{text("Hồ sơ của tôi", "My profile")}</h1>
      </div>

      <div className="profile-summary">
        <span className="profile-avatar" aria-hidden="true">{initials}</span>
        <div className="profile-identity">
          {roleLabels[user.role] && <span className="profile-role">{text(roleLabels[user.role])}</span>}
          <p className="profile-name">{account.name}</p>
          <p className="profile-email">{account.email}</p>
        </div>
      </div>

      <section className="panel profile-card" aria-labelledby="profile-details-heading">
        <div className="profile-card-heading">
          <span className="profile-section-icon"><UserRound size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="profile-details-heading">{text("Thông tin cá nhân", "Personal information")}</h2>
            <p>{text("Cập nhật tên và thông tin liên hệ của bạn.", "Update your name and contact details.")}</p>
          </div>
        </div>

        {form && (
          <form onSubmit={save} aria-busy={saving}>
            <fieldset disabled={saving} className="profile-fields">
              {fields.map(([key, vi, en, type, autoComplete, maxLength, required]) => (
                <label key={key} className={key === "address" ? "profile-field-wide" : undefined}
                  data-view-only={(readOnlyEmail && key === "email") || undefined}>
                  <span className="field-label">{text(vi, en)}</span>
                  <input className="field" type={type} autoComplete={autoComplete} maxLength={maxLength} required={required}
                    disabled={readOnlyEmail && key === "email"}
                    aria-describedby={key === "email" ? "profile-email-note" : undefined} value={form[key] ?? ""}
                    onChange={(event) => {
                      setDraft((current) => ({ ...current, [key]: event.target.value }));
                      setError("");
                      setSaved(false);
                    }} />
                </label>
              ))}
            </fieldset>
            <p id="profile-email-note" className="profile-note">
              <Info size={17} aria-hidden="true" />
              <span>{readOnlyEmail ? text("Email chỉ để xem.", "Email is read-only.") : text("Nếu đổi email, bạn cần đăng nhập lại bằng email mới.", "After changing your email, sign in again with the new address.")}</span>
            </p>
            <div className="profile-card-footer">
              {saved && (
                <p role="status" className="profile-saved">
                  <CircleCheck size={17} aria-hidden="true" />
                  {text("Đã lưu hồ sơ cá nhân.", "Profile saved.")}
                </p>
              )}
              <button type="submit" className="btn-primary" disabled={saving || !changed}>
                <Save size={16} aria-hidden="true" />
                {saving ? text("Đang lưu…", "Saving…") : text("Lưu hồ sơ", "Save profile")}
              </button>
            </div>
          </form>
        )}
        <div className="profile-feedback">
          <ApiFeedback state={state} actionError={error} />
        </div>
      </section>
      <ChangePasswordForm onChangePassword={onPasswordChange} />
    </div>
  );
}

function ChangePasswordForm({ onChangePassword }) {
  const text = useText();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const validation = resetPasswordErrors(newPassword, confirmation);
    if (validation) {
      setError(Object.values(validation.fields)[0]);
      return;
    }
    if (currentPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onChangePassword(currentPassword, newPassword);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel profile-card profile-password-card" aria-labelledby="profile-password-heading">
      <div className="profile-card-heading">
        <span className="profile-section-icon"><KeyRound size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="profile-password-heading">{text("Đổi mật khẩu", "Change password")}</h2>
          <p>{text("Bạn sẽ cần đăng nhập lại sau khi đổi mật khẩu.", "You'll need to sign in again after changing your password.")}</p>
        </div>
      </div>
      <form onSubmit={submit} onChange={() => setError("")}>
        <fieldset disabled={saving} className="profile-fields">
          <label className="profile-field-wide">
            <span className="field-label">{text("Mật khẩu hiện tại", "Current password")}</span>
            <input className="field" type="password" name="currentPassword" autoComplete="current-password"
              required maxLength={100} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </label>
          <label>
            <span className="field-label">{text("Mật khẩu mới", "New password")}</span>
            <input className="field" type="password" name="newPassword" autoComplete="new-password" required
              maxLength={72} value={newPassword} aria-describedby="profile-password-rules"
              onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label>
            <span className="field-label">{text("Xác nhận mật khẩu mới", "Confirm new password")}</span>
            <input className="field" type="password" name="confirmation" autoComplete="new-password" required
              maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
        </fieldset>
        <p id="profile-password-rules" className="profile-note">
          <Info size={17} aria-hidden="true" />
          <span>{text("Ít nhất 6 ký tự, có chữ hoa và ký tự đặc biệt. Tối đa 72 byte UTF-8.",
            "At least 6 characters, including an uppercase letter and a special character. Maximum 72 UTF-8 bytes.")}</span>
        </p>
        {error && <p role="alert" className="profile-feedback rounded-xl bg-red-50 p-4 text-sm text-red-700">{text(error)}</p>}
        <div className="profile-card-footer">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? text("Đang lưu…", "Saving…") : text("Đổi mật khẩu", "Change password")}
          </button>
        </div>
      </form>
    </section>
  );
}
