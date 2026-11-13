import { api } from "../../../api/apiClient.js";

export function getClassroomPractice(classroomId) {
  return api(`/instructor/classes/${classroomId}/practice`);
}
