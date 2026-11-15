import { useText } from "../../../preferences/preferencesContext";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import AdminDetailsDialog from "../AdminDetailsDialog";
import { roleLabels, statusLabels } from "../recordLabels.js";

export default function UserForm({ form, isOwnProfile, viewing, isSaving, actionError, onSubmit, onFieldChange, onCancel }) {
  const text = useText();
<<<<<<< Updated upstream
  const title = isOwnProfile ? text("Hồ sơ của tôi") : viewing ? text("Thông tin tài khoản", "Account details") : text("Tạo tài khoản");
=======
  const title = isOwnProfile ? text("Hồ sơ của tôi") : form.id
    ? text("Sửa tài khoản và phân quyền", "Edit account and role") : text("Tạo tài khoản");
>>>>>>> Stashed changes
  const creating = !form.id;
  const fieldsDisabled = viewing || (isOwnProfile && isSaving);
  const saveLabel = isOwnProfile ? text("Lưu hồ sơ") : text("Lưu tài khoản");
  const joined = form.joined && new Date(form.joined).toLocaleDateString("vi-VN");
  const fields = (
    <form onSubmit={onSubmit} className={creating ? "panel mb-6 space-y-4 p-6" : "space-y-4"}>
      {creating && <h2 className="text-lg font-bold">{title}</h2>}
      {isOwnProfile && <ApiFeedback actionError={actionError} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label data-view-only={viewing || undefined}>
          <span className="field-label">{text("Họ tên")}{creating && <span aria-hidden="true"> *</span>}</span>
          <input
            className="field"
            disabled={fieldsDisabled}
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        </label>
        <label data-view-only={!creating || undefined}>
          <span className="field-label">{text("Email")}{creating && <span aria-hidden="true"> *</span>}</span>
          <input
            className="field"
            disabled={!creating}
            required
            type="email"
            maxLength={254}
            value={form.email}
            aria-describedby={isOwnProfile ? "profile-email-hint" : undefined}
            onChange={(e) => onFieldChange("email", e.target.value)}
          />
          {isOwnProfile && (
            <span id="profile-email-hint" className="mt-1 block text-sm text-slate-600">
              {text("Email chỉ để xem.", "Email is read-only.")}
            </span>
          )}
        </label>
        {!form.id && (
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
        {viewing && (
          <>
            <div className="text-slate-600"><span className="field-label">{text("Vai trò")}</span>{text(roleLabels[form.role])}</div>
            <div className="text-slate-600"><span className="field-label">{text("Trạng thái")}</span>{text(statusLabels[form.status])}</div>
          </>
        )}
        {creating && (
          <>
            <label>
              <span id="user-role-label" className="field-label">{text("Vai trò")}{creating && <span aria-hidden="true"> *</span>}</span>
              <select
                className="field"
                required
                value={form.role}
                aria-labelledby="user-role-label"
                aria-describedby={form.id ? "user-role-note" : undefined}
                onChange={(e) => onFieldChange("role", e.target.value)}
              >
                {["admin", "instructor", "learner"].map((v) => (
                  <option key={v} value={v}>{text(roleLabels[v])}</option>
                ))}
              </select>
              {form.id && <span id="user-role-note" className="mt-1 block text-sm text-slate-600">
                {text("Sau khi đổi vai trò, người dùng cần đăng nhập lại để nhận quyền mới.",
                  "After a role change, the user signs in again to use their new permissions.")}
              </span>}
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
        <label data-view-only={viewing || undefined}>
          <span className="field-label">{text("Ngày sinh")}</span>
          <input
            className="field"
            disabled={fieldsDisabled}
            type="date"
            autoComplete="bday"
            value={form.dateOfBirth ?? ""}
            onChange={(e) => onFieldChange("dateOfBirth", e.target.value)}
          />
        </label>
        <label data-view-only={viewing || undefined}>
          <span className="field-label">{text("Số điện thoại")}</span>
          <input
            className="field"
            disabled={fieldsDisabled}
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={form.phone ?? ""}
            onChange={(e) => onFieldChange("phone", e.target.value)}
          />
        </label>
        <label className="sm:col-span-2" data-view-only={viewing || undefined}>
          <span className="field-label">{text("Địa chỉ")}</span>
          <input
            className="field"
            disabled={fieldsDisabled}
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
      {!viewing && <div className="flex gap-3">
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
      </div>}
    </form>
  );
  return creating ? fields : (
    <AdminDetailsDialog title={title} onClose={onCancel} closeDisabled={isOwnProfile && isSaving}>
      {fields}
    </AdminDetailsDialog>
  );
}
