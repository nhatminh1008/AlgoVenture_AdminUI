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
