import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { useText } from "../preferences/preferencesContext";
import AuthLayout from "./AuthLayout";
import { AuthField, EmailField, FormError, NewPasswordFields, OtpField, RequiredFieldsNote } from "./AuthFields";
import { useAuthForm, useFieldError, useSecondsRemaining } from "./authForms";
import { passwordErrors, registrationProof } from "./authValidation";
import { resendRegistration, startRegistration, verifyRegistration } from "./authService";

export function RegisterPage() {
  const text = useText();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { run, busy, failure } = useAuthForm();
  const fieldError = useFieldError(failure);

  function submit(event) {
    event.preventDefault();
    run(async () => {
      const challenge = await startRegistration(email);
      navigate("/verify-email", { state: { challenge, issuedAt: Date.now() } });
    });
  }

  return (
    <AuthLayout title={text("Tạo tài khoản", "Create an account")} backToLogin>
      <p className="login-description">{text(
        "Tạo tài khoản Learner để chơi AlgoVenture. Nhập email để nhận mã hoặc liên kết xác thực, rồi điền họ tên và mật khẩu.",
        "Create a Learner account to play AlgoVenture. Enter your email to receive a verification code or link, then provide your name and password.",
      )}</p>
      <form className="login-form" onSubmit={submit} aria-busy={busy}>
        <RequiredFieldsNote />
        <EmailField markRequired value={email} onChange={(event) => setEmail(event.target.value)} error={fieldError("email")} />
        <FormError failure={failure} fields={["email"]} />
        <button className="login-submit" disabled={busy}>
          {busy ? text("Đang gửi…", "Sending…") : text("Gửi mã xác thực", "Send verification code")}
        </button>
      </form>
    </AuthLayout>
  );
}

function captureLink(hash) {
  const proof = registrationProof(hash);
  return { hash, proof, invalid: Boolean(hash && !proof) };
}

export function VerifyEmailPage() {
  const text = useText();
  const location = useLocation();
  const navigate = useNavigate();
  const [captured, setCaptured] = useState(() => captureLink(location.hash));
  if (location.hash && location.hash !== captured.hash) setCaptured(captureLink(location.hash));
  const { proof: link, invalid: invalidLink } = captured;
  const [delivery, setDelivery] = useState(location.state);
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [verified, setVerified] = useState(false);
  const { run, busy, failure, setFailure } = useAuthForm();
  const fieldError = useFieldError(failure);
  const challenge = !link || link.registrationId === delivery?.challenge?.registrationId
    ? delivery?.challenge : null;
  const registrationId = link?.registrationId ?? challenge?.registrationId;
  const resendIn = useSecondsRemaining(challenge ? delivery.issuedAt + challenge.resendAfterSeconds * 1000 : 0);
  const expiresIn = useSecondsRemaining(challenge ? Date.parse(challenge.expiresAt) : 0);

  useEffect(() => {
    if (!location.hash) return;

    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: location.state });
  }, [location, navigate]);

  function submit(event) {
    event.preventDefault();
    const errors = passwordErrors(password, confirmation);
    if (!fullName.trim()) {
      setFailure({ fields: { ...errors?.fields, fullName: "Vui lòng nhập họ tên." } });
      return;
    }
    if (errors) {
      setFailure(errors);
      return;
    }
    run(async () => {
      await verifyRegistration({ registrationId, token: link?.token, otp, fullName, password });
      setPassword("");
      setConfirmation("");
      setCaptured(captureLink(""));
      setVerified(true);
    });
  }

  function resend() {
    run(async () => {
      const challenge = await resendRegistration(registrationId);
      setDelivery({ challenge, issuedAt: Date.now() });
      setCaptured(captureLink(""));
      setOtp("");
    });
  }

  const title = text("Xác thực email", "Verify your email");
  if (verified) {
    return (
      <AuthLayout title={title} backToLogin>
        <p role="status" className="login-success">{text(
          "Xác thực thành công. Bạn có thể dùng tài khoản Learner vừa tạo để đăng nhập Game. Portal dành cho Admin và Instructor.",
          "Email verified. You can use your new Learner account to sign in to the Game. The Portal is for Admins and Instructors.",
        )}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title} backToLogin>
      {invalidLink && <p className="login-error login-notice" role="alert">{text(
        "Liên kết xác thực không hợp lệ. Vui lòng kiểm tra email hoặc yêu cầu mã mới.",
        "The verification link is invalid. Check your email or request a new code.",
      )}</p>}
      {!registrationId ? (
        <Link className="login-link login-back" to="/register">{text("Yêu cầu mã xác thực", "Request a verification code")}</Link>
      ) : (
        <>
          <p className="login-description" role="status">
            {link ? text("Điền họ tên và mật khẩu để hoàn tất đăng ký qua liên kết xác thực.",
              "Enter your name and password to complete registration using your verification link.")
              : text(`Mã xác thực đã được gửi đến ${challenge.maskedEmail}.`, `We sent a verification code to ${challenge.maskedEmail}.`)}
          </p>
          {!link && expiresIn === 0 && <p className="login-description">{text(
            "Mã đã hết hạn. Hãy gửi lại mã để tiếp tục.", "The code has expired. Request a new code to continue.",
          )}</p>}
          <form className="login-form" onSubmit={submit} aria-busy={busy}>
            <RequiredFieldsNote />
            {!link && <OtpField value={otp} onValueChange={setOtp} error={fieldError("otp")} />}
            <AuthField label={text("Họ và tên", "Full name")} name="fullName" icon={UserRound} required markRequired
              maxLength={100} autoComplete="name" value={fullName} error={fieldError("fullName")}
              onChange={(event) => setFullName(event.target.value)} />
            <NewPasswordFields password={password} confirmation={confirmation} setPassword={setPassword}
              setConfirmation={setConfirmation} errors={{ password: fieldError("password"), confirmation: fieldError("confirmation") }} />
            <FormError failure={failure} fields={link ? ["fullName", "password", "confirmation"] : ["otp", "fullName", "password", "confirmation"]} />
            <button className="login-submit" disabled={busy}>
              {busy ? text("Đang xử lý…", "Working…") : text("Xác thực và tạo tài khoản", "Verify and create account")}
            </button>
            <button className="login-link" type="button" onClick={resend} disabled={busy || resendIn > 0}>
              {resendIn ? text(`Gửi lại mã sau ${resendIn} giây`, `Resend code in ${resendIn}s`) : text("Gửi lại mã", "Resend code")}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
