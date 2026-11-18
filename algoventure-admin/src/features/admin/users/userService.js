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
      ...(user.role === "admin" && { status: user.status }),
      profile: profileFields(user),
    },
  });
}

export async function setUserLocked(user, locked) {
  const path = "/admin/users/" + encodeURIComponent(user.id);
  try {
    await api("/admin/users/access-actions");
  } catch (error) {
    // Older backends reject the capability path during Spring Security's error dispatch.
    if (![403, 404, 405].includes(error.status)) throw error;
    return api(path, {
      method: "PUT",
      body: { name: user.name, role: user.role, status: locked ? "Suspended" : "Active" },
    });
  }
  if (locked) return lockUser(user.id);
  return api(path + "/unlock", { method: "PUT" });
}

export function lockUser(id) {
  return api("/admin/users/" + encodeURIComponent(id) + "/lock", { method: "PUT" });
}

export function deactivateUser(id) {
  return api("/admin/users/" + encodeURIComponent(id) + "/deactivate", { method: "PUT" });
}

export function changeUserRole({ id, role }) {
  return api("/admin/users/" + encodeURIComponent(id) + "/role", {
    method: "PUT",
    body: { role },
  });
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
