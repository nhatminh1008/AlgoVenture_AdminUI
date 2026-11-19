import { api } from "../../../api/apiClient.js";

export const listAchievements = () => api("/admin/achievements");

export function setAchievementEnabled(id, enabled) {
  return api(`/admin/achievements/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: { enabled },
  });
}
