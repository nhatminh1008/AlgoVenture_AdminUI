import { useText } from "../../../preferences/preferencesContext";
import { roleLabels, statusLabels } from "../recordLabels.js";

export default function UserForm({ form, isOwnProfile, isSaving, onSubmit, onFieldChange, onCancel }) {
  const text = useText();
  const title = isOwnProfile ? text("Hồ sơ của tôi") : text("Tạo tài khoản");
  const creating = !isOwnProfile;
  const saveLabel = isOwnProfile ? text("Lưu hồ sơ") : text("Lưu tài khoản");
  const joined = form.joined && new Date(form.joined).toLocaleDateString("vi-VN");
  return (
    <form onSubmit={onSubmit} className="panel mb-6 space-y-4 p-6">
      <h2 className="text-lg font-bold">
        {title}
      </h2>
      {isOwnProfile && (
        <p className="text-sm text-slate-600">
          {text("Bạn có thể cập nhật thông tin cá nhân tại đây.", "You can update your personal information here.")}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">{text("Họ tên")}{creating && <span aria-hidden="true"> *</span>}</span>
          <input
            className="field"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        </label>
        <label>
          <span className="field-label">{text("Email")}{creating && <span aria-hidden="true"> *</span>}</span>
          <input
            className="field"
            required
            type="email"
            maxLength={254}
            value={form.email}
            aria-describedby={isOwnProfile ? "profile-email-hint" : undefined}
            onChange={(e) => onFieldChange("email", e.target.value)}
          />
          {isOwnProfile && (
            <span id="profile-email-hint" className="mt-1 block text-sm text-slate-600">
              {text("Nếu đổi email, bạn cần đăng nhập lại bằng email mới.")}
            </span>
          )}
        </label>
        {creating && (
          <label>
            <span className="field-label">{text("Mật khẩu (10–72 ký tự)")}{creating && <span aria-hidden="true"> *</span>}</span>
            <input
              className="field"
              required
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={72}
              value={form.password}
              onChange={(e) => onFieldChange("password", e.target.value)}
            />
          </label>
        )}
        {!isOwnProfile && (
          <>
            <label>
              <span className="field-label">{text("Vai trò")}{creating && <span aria-hidden="true"> *</span>}</span>
              <select
                className="field"
                required
                value={form.role}
                onChange={(e) => onFieldChange("role", e.target.value)}
              >
                {["admin", "instructor", "learner"].map((v) => (
                  <option key={v} value={v}>{text(roleLabels[v])}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">{text("Trạng thái")}{creating && <span aria-hidden="true"> *</span>}</span>
              <select
                className="field"
                required
                value={form.status}
                onChange={(e) => onFieldChange("status", e.target.value)}
              >
                {["Active", "Suspended"].map((v) => (
                  <option key={v} value={v}>{text(statusLabels[v])}</option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-700">{text("Thông tin bổ sung (không bắt buộc)")}</legend>
        <label>
          <span className="field-label">{text("Ngày sinh")}</span>
          <input
            className="field"
            type="date"
            autoComplete="bday"
            value={form.dateOfBirth ?? ""}
            onChange={(e) => onFieldChange("dateOfBirth", e.target.value)}
          />
        </label>
        <label>
          <span className="field-label">{text("Số điện thoại")}</span>
          <input
            className="field"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={form.phone ?? ""}
            onChange={(e) => onFieldChange("phone", e.target.value)}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">{text("Địa chỉ")}</span>
          <input
            className="field"
            autoComplete="street-address"
            maxLength={255}
            value={form.address ?? ""}
            onChange={(e) => onFieldChange("address", e.target.value)}
          />
        </label>
      </fieldset>
      {joined && (
        <p className="text-sm text-slate-600">
          {text("Ngày tham gia ")} <time dateTime={form.joined}>{joined}</time>
        </p>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={isSaving}>
          {isSaving ? text("Đang lưu…") : saveLabel}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={isSaving}
          onClick={onCancel}
        >
          {text("Hủy")}
        </button>
      </div>
    </form>
  );
}
