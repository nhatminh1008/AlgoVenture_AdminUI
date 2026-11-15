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

export function createUser(user) {
  return api("/admin/users", {
    method: "POST",
    body: {
      email: user.email.trim(),
      name: user.name.trim(),
      password: user.password,
      role: user.role,
      status: user.status,
      profile: profileFields(user),
    },
  });
}

export function lockUser(id) {
  return api("/admin/users/" + encodeURIComponent(id) + "/lock", { method: "PUT" });
}

export function saveMyProfile({ name, dateOfBirth, phone, address }) {
  return api("/admin/me/profile", {
    method: "PUT",
    body: {
      name: name.trim(),
      ...profileFields({ dateOfBirth, phone, address }),
    },
  });
}
