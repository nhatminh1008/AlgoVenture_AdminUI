export function passwordErrors(password, confirmation) {
  return validatePassword(password, confirmation, "password", 10);
}

export function resetPasswordErrors(password, confirmation) {
  return validatePassword(password, confirmation, "newPassword", 6, true);
}

function validatePassword(password, confirmation, name, minimum, requireComplexity = false) {
  const fields = {};
  if (!password.trim() || (requireComplexity ? [...password].length : password.length) < minimum) {
    fields[name] = `Mật khẩu phải có ít nhất ${minimum} ký tự.`;
  } else if (new TextEncoder().encode(password).length > 72) {
    fields[name] = "Mật khẩu không được vượt quá 72 byte UTF-8.";
  } else if (requireComplexity && (!/\p{Lu}/u.test(password) || !/[\p{P}\p{S}]/u.test(password))) {
    fields[name] = "Mật khẩu phải có ít nhất một chữ hoa và một ký tự đặc biệt.";
  }
  if (password !== confirmation) fields.confirmation = "Mật khẩu xác nhận không khớp.";
  return Object.keys(fields).length ? { fields } : null;
}

export function registrationProof(hash) {
  const params = new URLSearchParams(hash.slice(1));
  const registrationId = params.get("registrationId");
  const token = params.get("token");
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(registrationId ?? "")) return null;
  if (!/^[\w-]{43}$/.test(token ?? "")) return null;
  return { registrationId, token };
}

export function maskEmail(email) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
