import { api } from "../api/apiClient.js";

export function getCurrentUser() {
  return api("/auth/me");
}

export function getGoogleLoginStatus() {
  return api("/auth/google");
}

export function startGoogleLogin() {
  return api("/auth/google/start", { method: "POST" });
}

export function login(identifier, password) {
  const value = identifier.trim();
  return api("/auth/login", {
    method: "POST",
    body: { [value.includes("@") ? "email" : "username"]: value, password },
  });
}

export function logout() {
  return api("/auth/logout", { method: "POST" });
}

function post(path, body) {
  return api("/auth" + path, { method: "POST", body });
}

export function startRegistration(email) {
  return post("/registrations", { email: email.trim() });
}

export function resendRegistration(id) {
  return post(`/registrations/${encodeURIComponent(id)}/resend`);
}

export function verifyRegistration({ registrationId, otp, token, fullName, username, password }) {
  const proof = token ? { token } : { otp };
  return post("/registrations/verify", { registrationId, ...proof, fullName: fullName.trim(), username: username?.trim() || undefined, password });
}

export function getGoogleOnboarding() {
  return api("/auth/google/onboarding");
}

export function completeGoogleOnboarding(form) {
  return post("/google/onboarding", form);
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
