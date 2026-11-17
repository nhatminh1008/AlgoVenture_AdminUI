import { api } from "../../../api/apiClient.js";

export const listAchievements = () => api("/admin/achievements");

export function saveAchievement(id, form) {
  return api(id ? `/admin/achievements/${id}` : "/admin/achievements", {
    method: id ? "PUT" : "POST",
    body: form,
  });
}
