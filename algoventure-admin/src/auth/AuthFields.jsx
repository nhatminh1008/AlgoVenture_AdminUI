import { useId, useState } from "react";
import { Eye, EyeOff, Hash, LockKeyhole, Mail } from "lucide-react";
import { useText } from "../preferences/preferencesContext";

export function AuthField({ label, icon: Icon, markRequired, error, hint, children, ...input }) {
  const id = useId();
  const description = [error && id + "-error", hint && id + "-hint"].filter(Boolean).join(" ");
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}{markRequired && <span aria-hidden="true"> *</span>}
      </label>
      <div className="login-input-wrap">
        {Icon && <Icon size={18} aria-hidden="true" />}
        <input className="field" id={id} aria-invalid={error ? true : undefined}
          aria-describedby={description || undefined} {...input} />
        {children?.(id)}
      </div>
      {hint && <p className="login-field-note" id={id + "-hint"}>{hint}</p>}
      {error && <p className="login-field-error" id={id + "-error"}>{error}</p>}
    </div>
  );
}

export function EmailField(props) {
  const text = useText();
  return <AuthField label={text("Địa chỉ email")} name="email" icon={Mail} type="email"
    required maxLength={254} autoComplete="email" placeholder={text("ban@algoventure.edu", "you@algoventure.edu")} {...props} />;
}

export function PasswordField({ isNew = false, ...props }) {
  const text = useText();
  const [visible, setVisible] = useState(false);
  return (
    <AuthField label={text("Mật khẩu")} name="password" icon={LockKeyhole}
      type={visible ? "text" : "password"} required
      autoComplete={isNew ? "new-password" : "current-password"} maxLength={isNew ? 72 : undefined}
      placeholder={text("Nhập mật khẩu")} {...props}>
      {(id) => (
        <button type="button" className="login-password-toggle"
          aria-label={visible ? text("Ẩn mật khẩu") : text("Hiện mật khẩu")}
          aria-pressed={visible} aria-controls={id} onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      )}
    </AuthField>
  );
}

export function NewPasswordFields({ passwordName = "password", hint, errors, password, confirmation, setPassword, setConfirmation }) {
  const text = useText();
  return (
    <>
      <PasswordField isNew markRequired label={text("Mật khẩu mới", "New password")} name={passwordName}
        value={password} onChange={(event) => setPassword(event.target.value)} error={errors?.[passwordName]}
        hint={hint ?? text("Ít nhất 10 ký tự, tối đa 72 byte UTF-8.", "At least 10 characters and at most 72 UTF-8 bytes.")} />
      <PasswordField isNew markRequired label={text("Xác nhận mật khẩu", "Confirm password")} name="confirmation"
        value={confirmation} onChange={(event) => setConfirmation(event.target.value)} error={errors?.confirmation} />
    </>
  );
}

export function OtpField({ value, onValueChange, ...props }) {
  const text = useText();
  return <AuthField label={text("Mã xác thực", "Verification code")} name="otp" icon={Hash}
    type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000"
    maxLength={6} pattern="[0-9]{6}" required markRequired value={value}
    onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ""))} {...props} />;
}

export function RequiredFieldsNote() {
  const text = useText();
  return <p className="login-field-note login-required">{text("* Các trường có dấu (*) là thông tin bắt buộc.", "* Fields marked with an asterisk (*) are required.")}</p>;
}

export function FormError({ failure, fields = [] }) {
  const text = useText();
  if (!failure || (failure.fields && Object.keys(failure.fields).every((field) => fields.includes(field)))) return null;
  return <p className="login-error" role="alert">{text(failure.message)}</p>;
}
