import { api } from "../../../api/apiClient.js";

export function getAdminAnalytics() {
  return api("/admin/analytics");
}
