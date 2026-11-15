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

async function updateAccess(user, action, changes) {
  const path = "/admin/users/" + encodeURIComponent(user.id);
  try {
    await api("/admin/users/access-actions");
  } catch (error) {
    // Older backends reject the capability path during Spring Security's error dispatch.
    if (![403, 404, 405].includes(error.status)) throw error;
    return api(path, {
      method: "PUT",
      body: { name: user.name, role: user.role, status: user.status, ...changes },
    });
  }
  if (action === "lock") return lockUser(user.id);
  return api(path + "/" + action, {
    method: "PUT",
    body: action === "role" ? changes : undefined,
  });
}

export function lockUser(id) {
  return api("/admin/users/" + encodeURIComponent(id) + "/lock", { method: "PUT" });
}

export function setUserLocked(user, locked) {
  return updateAccess(user, locked ? "lock" : "unlock", { status: locked ? "Suspended" : "Active" });
}

export function changeUserRole(user) {
  return updateAccess(user, "role", { role: user.role });
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
