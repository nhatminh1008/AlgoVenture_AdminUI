import { api } from "../../../api/apiClient.js";

export async function getInstructorState() {
  const [state, topics] = await Promise.all([
    api("/instructor/state"),
    api("/instructor/curriculum"),
  ]);
  return { ...state, topics };
}

function saveInstructorRecord(resource, values, id) {
  return api(`/instructor/${resource}${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: { ...values, due: values.due || null },
  });
}

export function saveClassroom(values, id) {
  return saveInstructorRecord("classes", values, id);
}

export function saveAssignment(values, id) {
  return saveInstructorRecord("assignments", values, id);
}

export function saveQuiz(values, id) {
  return saveInstructorRecord("quizzes", values, id);
}

export function deleteQuiz(id) {
  return api(`/instructor/quizzes/${id}`, { method: "DELETE" });
}
