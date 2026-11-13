import { api } from "../../../api/apiClient.js";

export function listLessons() {
  return api("/admin/algorithms");
}

export function updateLesson(id, lesson) {
  return api(`/admin/algorithms/${id}`, { method: "PUT", body: lesson });
}
