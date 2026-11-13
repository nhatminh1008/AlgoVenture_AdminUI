import { api } from "../../../api/apiClient.js";

export function listFeatureFlags() {
  return api("/admin/features");
}

export function updateFeatureFlag(id, enabled) {
  return api(`/admin/features/${id}`, { method: "PUT", body: { enabled } });
}
