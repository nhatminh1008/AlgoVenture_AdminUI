import { api } from "../api/apiClient.js";

export function getCurrentUser() {
  return api("/auth/me");
}

export function login(email, password) {
  return api("/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });
}

export function logout() {
  return api("/auth/logout", { method: "POST" });
}

function post(path, body) {
  return api("/auth" + path, { method: "POST", body });
}

export function requestResetCode(email, resend = false) {
  return post(resend ? "/password-reset-otp-resends" : "/password-reset-otp-requests", { email: email.trim() });
}

export function verifyResetCode(email, otp) {
  return post("/password-reset-otp-verifications", { email: email.trim(), otp });
}

export function resetPassword(token, newPassword) {
  return post("/password-resets", { token, newPassword });
}
