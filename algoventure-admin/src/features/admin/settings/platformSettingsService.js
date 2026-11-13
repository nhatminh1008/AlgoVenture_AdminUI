import { api } from "../../../api/apiClient.js";

export function getPlatformSettings() {
  return api("/admin/settings");
}

export function updatePlatformSettings(settings) {
  return api("/admin/settings", { method: "PUT", body: settings });
}

export function getPortalExport() {
  return api("/admin/export");
}
