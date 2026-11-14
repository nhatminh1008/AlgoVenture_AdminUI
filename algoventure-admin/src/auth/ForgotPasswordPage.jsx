import { useState } from "react";
import AuthLayout from "./AuthLayout";
import { EmailField, FormError, NewPasswordFields, OtpField, RequiredFieldsNote } from "./AuthFields";
import { useAuthForm, useFieldError, useSecondsRemaining } from "./authForms";
import { maskEmail, resetPasswordErrors } from "./authValidation";
import { requestResetCode, resetPassword, verifyResetCode } from "./authService";
import { useText } from "../preferences/preferencesContext";

const resendDelay = 60_000;

export default function ForgotPasswordPage() {
  const text = useText();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [deliveryNotice, setDeliveryNotice] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [grant, setGrant] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { run, busy, failure, setFailure } = useAuthForm();
  const resendIn = useSecondsRemaining(resendAt);
  const grantTime = useSecondsRemaining(grant ? Date.parse(grant.expiresAt) : 0);
  const fieldError = useFieldError(failure);

  function sendCode(resend) {
    run(async () => {
      const result = await requestResetCode(email, resend);
      setDeliveryNotice(result.message);
      setResendAt(Date.now() + resendDelay);
      setOtp("");
      setStep("otp");
    });
  }

  function verify(event) {
    event.preventDefault();
    run(async () => {
      setGrant(await verifyResetCode(email, otp));
      setOtp("");
      setStep("password");
    });
  }

  function updatePassword(event) {
    event.preventDefault();
    const errors = resetPasswordErrors(password, confirmation);
    if (errors) {
      setFailure(errors);
      return;
    }
    run(async () => {
      await resetPassword(grant.token, password);
      setGrant(null);
      setPassword("");
      setConfirmation("");
      setStep("done");
    });
  }

  function restart() {
    setFailure(null);
    setGrant(null);
    setOtp("");
    setPassword("");
    setConfirmation("");
    setStep("email");
  }

  const titles = {
    email: text("Quên mật khẩu", "Forgot password"),
    otp: text("Xác thực mã đặt lại mật khẩu", "Verify your reset code"),
    password: text("Đặt lại mật khẩu", "Reset password"),
    done: text("Đã đặt lại mật khẩu", "Password reset"),
  };

  return (
    <AuthLayout title={titles[step]} backToLogin>
      {step === "email" && (
        <>
          <p className="login-description">{text("Nhập email tài khoản để yêu cầu mã đặt lại mật khẩu.",
            "Enter your account email to request a password reset code.")}</p>
          <form className="login-form" onSubmit={(event) => { event.preventDefault(); sendCode(false); }} aria-busy={busy}>
            <RequiredFieldsNote />
            <EmailField markRequired value={email} error={fieldError("email")} onChange={(event) => setEmail(event.target.value)} />
            <FormError failure={failure} fields={["email"]} />
            <button className="login-submit" disabled={busy}>
              {busy ? text("Đang gửi…", "Sending…") : text("Gửi mã xác thực", "Send verification code")}
            </button>
          </form>
        </>
      )}
      {step === "otp" && (
        <>
          <p className="login-description" role="status">{text(deliveryNotice)} ({maskEmail(email.trim())})</p>
          <form className="login-form" onSubmit={verify} aria-busy={busy}>
            <OtpField value={otp} onValueChange={setOtp} error={fieldError("otp")} />
            <FormError failure={failure} fields={["otp"]} />
            <button className="login-submit" disabled={busy}>
              {busy ? text("Đang xác thực…", "Verifying…") : text("Xác thực mã", "Verify code")}
            </button>
            <button className="login-link" type="button" onClick={() => sendCode(true)} disabled={busy || resendIn > 0}>
              {resendIn ? text(`Gửi lại mã sau ${resendIn} giây`, `Resend code in ${resendIn}s`) : text("Gửi lại mã", "Resend code")}
            </button>
            <button className="login-link" type="button" onClick={restart} disabled={busy}>{text("Đổi email", "Change email")}</button>
          </form>
        </>
      )}
      {step === "password" && (
        <form className="login-form" onSubmit={updatePassword} aria-busy={busy}>
          {grantTime > 0 ? (
            <>
              <RequiredFieldsNote />
              <NewPasswordFields passwordName="newPassword" password={password} confirmation={confirmation}
                setPassword={setPassword} setConfirmation={setConfirmation}
                hint={text("Ít nhất 6 ký tự, gồm một chữ hoa và một ký tự đặc biệt. Tối đa 72 byte UTF-8.",
                  "Use at least 6 characters, including one uppercase letter and one special character. Maximum 72 UTF-8 bytes.")}
                errors={{ newPassword: fieldError("newPassword"), confirmation: fieldError("confirmation") }} />
              <FormError failure={failure} fields={["newPassword", "confirmation"]} />
              <button className="login-submit" disabled={busy}>
                {busy ? text("Đang lưu…", "Saving…") : text("Lưu mật khẩu mới", "Save new password")}
              </button>
            </>
          ) : <p className="login-error" role="alert">{text(
            "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.", "Your password reset session has expired. Request a new code.",
          )}</p>}
          <button className="login-link" type="button" onClick={restart} disabled={busy}>
            {text("Yêu cầu mã mới", "Request a new code")}
          </button>
        </form>
      )}
      {step === "done" && <p className="login-success" role="status">{text(
        "Đã cập nhật mật khẩu và thu hồi các phiên cũ. Vui lòng đăng nhập lại.",
        "Your password has changed and previous sessions were revoked. Please sign in again.",
      )}</p>}
    </AuthLayout>
  );
}
