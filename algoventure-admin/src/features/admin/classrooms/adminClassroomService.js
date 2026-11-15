import { api } from "../../../api/apiClient.js";

const ADMIN_CLASSROOMS_PATH = "/admin/classes";

function getClassroomPath(id) {
  return `${ADMIN_CLASSROOMS_PATH}/${encodeURIComponent(id)}`;
}

export function listClassrooms() {
  return api(ADMIN_CLASSROOMS_PATH);
}

export function setClassroomLocked(id, locked) {
  return api(getClassroomPath(id) + "/lock", { method: "PUT", body: { locked } });
}

export function listClassroomMembers(classroomId) {
  return api(getClassroomPath(classroomId) + "/members");
}

export function listClassroomChallengeSets(classroomId) {
  return api(getClassroomPath(classroomId) + "/challenge-sets");
}
