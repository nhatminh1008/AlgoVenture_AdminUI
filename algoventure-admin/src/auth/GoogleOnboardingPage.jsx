import { useEffect, useState } from "react";
import { MapPin, Phone, UserRound } from "lucide-react";
import { useText } from "../preferences/preferencesContext";
import AuthLayout from "./AuthLayout";
import { AuthField, EmailField, FormError, NewPasswordFields, RequiredFieldsNote } from "./AuthFields";
import { useAuthForm, useFieldError } from "./authForms";
import { completeGoogleOnboarding, getGoogleOnboarding } from "./authService";
import { passwordErrors, usernameError } from "./authValidation";

export default function GoogleOnboardingPage() {
  const text = useText();
  const [identity, setIdentity] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [form, setForm] = useState({ username: "", fullName: "", password: "", confirmation: "",
    dateOfBirth: "", phone: "", address: "" });
  const { run, busy, failure, setFailure } = useAuthForm();
  const fieldError = useFieldError(failure);

  useEffect(() => {
    let mounted = true;
    getGoogleOnboarding().then((result) => {
      if (mounted) setIdentity(result);
    }).catch((error) => {
      if (mounted) setFailure(error);
    }).finally(() => {
      if (mounted) setLoaded(true);
    });
    return () => { mounted = false; };
  }, [setFailure]);

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const input = (name) => ({ name, value: form[name], error: fieldError(name),
    onChange: (event) => set(name, event.target.value) });

  function submit(event) {
    event.preventDefault();
    const password = passwordErrors(form.password, form.confirmation);
    const username = usernameError(form.username);
    if (password || username || !form.fullName.trim()) {
      setFailure({ fields: { ...password?.fields, username, fullName: !form.fullName.trim() ? "Vui lòng nhập họ tên." : undefined } });
      return;
    }
    run(async () => {
      await completeGoogleOnboarding({
        username: form.username.trim(), fullName: form.fullName.trim(), password: form.password,
        dateOfBirth: form.dateOfBirth || null, phone: form.phone.trim() || null, address: form.address.trim() || null,
      });
      setForm((current) => ({ ...current, password: "", confirmation: "" }));
      setComplete(true);
    });
  }

  const title = text("Hoàn thiện tài khoản Google", "Complete your Google account setup");
  return (
    <AuthLayout title={title} backToLogin>
      {complete ? <p role="status" className="login-success">{text(
        "Đã tạo tài khoản Learner. Mở Unity và đăng nhập bằng Google hoặc bằng tên đăng nhập và mật khẩu vừa tạo.",
        "Your learner account is ready. Open Unity to sign in with Google or with your new username and password.",
      )}</p> : !loaded ? <p role="status" className="login-description">{text("Đang kiểm tra email…", "Checking your email…")}</p>
        : !identity ? <FormError failure={failure} /> : (
          <form className="login-form" aria-busy={busy} onSubmit={submit}>
            <RequiredFieldsNote />
            <EmailField value={identity.email} readOnly />
            <AuthField {...input("username")} label={text("Tên đăng nhập", "Username")} icon={UserRound}
              autoComplete="username" maxLength={30} markRequired required
              hint={text("Dùng 3–30 ký tự. Bắt đầu bằng chữ cái hoặc số.", "Use 3–30 characters. Start with a letter or number.")} />
            <AuthField {...input("fullName")} label={text("Họ và tên", "Full name")} icon={UserRound}
              autoComplete="name" maxLength={100} markRequired required />
            <NewPasswordFields password={form.password} confirmation={form.confirmation}
              setPassword={(value) => set("password", value)} setConfirmation={(value) => set("confirmation", value)}
              errors={{ password: fieldError("password"), confirmation: fieldError("confirmation") }} />
            <AuthField {...input("dateOfBirth")} label={text("Ngày sinh", "Date of birth")} type="date" autoComplete="bday" />
            <AuthField {...input("phone")} label={text("Số điện thoại", "Phone")} type="tel" icon={Phone} maxLength={20} autoComplete="tel" />
            <AuthField {...input("address")} label={text("Địa chỉ", "Address")} icon={MapPin} maxLength={255} autoComplete="street-address" />
            <FormError failure={failure} fields={Object.keys(form)} />
            <button type="submit" className="login-submit" disabled={busy}>
              {busy ? text("Đang tạo tài khoản…", "Creating account…") : text("Hoàn tất đăng ký", "Finish registration")}
            </button>
          </form>
        )}
    </AuthLayout>
  );
}
