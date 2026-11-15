import { api } from "../../../api/apiClient.js";

const ADMIN_CLASSROOMS_PATH = "/admin/classes";

function getClassroomPath(id) {
  return `${ADMIN_CLASSROOMS_PATH}/${encodeURIComponent(id)}`;
}

function getMembersPath(classroomId) {
  return `${getClassroomPath(classroomId)}/members`;
}

export function listClassrooms() {
  return api(ADMIN_CLASSROOMS_PATH);
}

export function setClassroomLocked(id, locked) {
  return api(getClassroomPath(id) + "/lock", { method: "PUT", body: { locked } });
}

export function listClassroomMembers(classroomId) {
  return api(getMembersPath(classroomId));
}
