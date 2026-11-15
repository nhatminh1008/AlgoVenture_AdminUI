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

export function listClassroomTopics() {
  return api("/admin/curriculum");
}

export function saveClassroom(id, classroom) {
  return api(id ? getClassroomPath(id) : ADMIN_CLASSROOMS_PATH, {
    method: id ? "PUT" : "POST",
    body: classroom,
  });
}

export function archiveClassroom(id) {
  return api(getClassroomPath(id), { method: "DELETE" });
}

export function listClassroomMembers(classroomId) {
  return api(getMembersPath(classroomId));
}

export function addClassroomMember(classroomId, userId) {
  return api(getMembersPath(classroomId), { method: "POST", body: { userId } });
}

export function removeClassroomMember(classroomId, userId) {
  return api(`${getMembersPath(classroomId)}/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}
