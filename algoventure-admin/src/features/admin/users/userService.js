import { api } from "../../../api/apiClient.js";

export function listUsers() {
  return api("/admin/users");
}

function profileFields({ dateOfBirth, phone, address }) {
  return {
    dateOfBirth: dateOfBirth || null,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
  };
}

export function saveUser(user) {
  const body = { name: user.name.trim(), role: user.role, status: user.status, profile: profileFields(user) };
  if (!user.id) {
    body.email = user.email.trim();
    body.password = user.password;
  }
  return api(user.id ? `/admin/users/${encodeURIComponent(user.id)}` : "/admin/users", {
    method: user.id ? "PUT" : "POST",
    body,
  });
}

export function saveMyProfile({ email, name, dateOfBirth, phone, address }) {
  return api("/admin/me/profile", {
    method: "PUT",
    body: {
      email: email.trim(),
      name: name.trim(),
      ...profileFields({ dateOfBirth, phone, address }),
    },
  });
}
