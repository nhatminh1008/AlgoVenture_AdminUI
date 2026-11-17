import { useId } from "react";
import { useLocale, useText } from "../../../preferences/preferencesContext";
import { ApiFeedback } from "../../../shared/components/ApiFeedback";
import AdminDetailsDialog from "../AdminDetailsDialog";
import { roleLabels, statusLabels } from "../recordLabels.js";

export default function UserForm({ form, isOwnProfile, viewing, editableRoles, roleChanged, isSaving, actionError, onSubmit, onFieldChange, onCancel }) {
  const text = useText();
  const locale = useLocale();
  const formId = useId();
  const title = isOwnProfile ? text("Hồ sơ của tôi") : viewing ? text("Thông tin tài khoản", "Account details") : text("Tạo tài khoản");
  const creating = !form.id;
  const fieldsDisabled = viewing || (isOwnProfile && isSaving);
  const saveLabel = isOwnProfile ? text("Lưu hồ sơ") : viewing ? text("Lưu vai trò", "Save role") : text("Lưu tài khoản");
  const roleOptions = creating ? ["admin", "instructor", "learner"] : editableRoles;
  const joined = form.joined && new Date(form.joined).toLocaleDateString(locale);
  const actions = (
    <div className="admin-form-actions flex gap-3">
      {(!viewing || roleOptions.length > 0) && (
        <button type="submit" form={formId} className="btn-primary" disabled={isSaving || (viewing && !roleChanged)}>
          {isSaving ? text("Đang lưu…") : saveLabel}
        </button>
      )}
      <button type="button" className="btn-secondary" disabled={isSaving} onClick={onCancel}>
        {text("Hủy")}
      </button>
    </div>
  );
  const fields = (
    <form id={formId} onSubmit={onSubmit} className={creating ? "admin-form panel mb-6 space-y-4 p-6" : "admin-form space-y-4"}>
      {creating && <h2 className="text-lg font-bold">{title}</h2>}
      {!creating && <ApiFeedback actionError={actionError} />}
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
        {creating ? <label>
          <span className="field-label">{text("Email")}<span aria-hidden="true"> *</span></span>
          <input
            className="field"
            required
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
          />
        </label> : <div>
          <span className="field-label">{text("Email")}</span>
          <p className="field admin-field-value">{form.email}</p>
          {isOwnProfile && (
            <p className="mt-1 text-sm text-slate-600">
              {text("Email chỉ để xem.", "Email is read-only.")}
            </p>
          )}
        </div>}
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
        {!isOwnProfile && roleOptions.length > 0 && (
            <label>
              <span id="user-role-label" className="field-label">{text("Vai trò")}{creating && <span aria-hidden="true"> *</span>}</span>
              <select
                className="field"
                required
                disabled={isSaving}
                value={form.role}
                aria-labelledby="user-role-label"
                aria-describedby={form.id ? "user-role-note" : undefined}
                onChange={(e) => onFieldChange("role", e.target.value)}
              >
                {roleOptions.map((v) => (
                  <option key={v} value={v}>{text(roleLabels[v])}</option>
                ))}
              </select>
              {form.id && <span id="user-role-note" className="mt-1 block text-sm text-slate-600">
                {text("Sau khi đổi vai trò, người dùng cần đăng nhập lại để nhận quyền mới.",
                  "After a role change, the user signs in again to use their new permissions.")}
              </span>}
            </label>
        )}
        {viewing && roleOptions.length === 0 && (
          <div className="text-slate-600">
            <span className="field-label">{text("Vai trò")}</span>{text(roleLabels[form.role] ?? form.role)}
          </div>
        )}
        {viewing && (
          <div className="text-slate-600"><span className="field-label">{text("Trạng thái")}</span>{text(statusLabels[form.status])}</div>
        )}
        {creating && form.role === "admin" && (
            <label>
              <span className="field-label">{text("Trạng thái")}<span aria-hidden="true"> *</span></span>
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
      {creating && actions}
    </form>
  );
  return creating ? fields : (
    <AdminDetailsDialog title={title} onClose={onCancel} closeDisabled={isSaving} footer={actions}>
      {fields}
    </AdminDetailsDialog>
  );
}
