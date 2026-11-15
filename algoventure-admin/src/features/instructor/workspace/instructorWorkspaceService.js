import { api } from "../../../api/apiClient.js";

export async function getInstructorState() {
  const [state, topics, assignmentTemplates] = await Promise.all([
    api("/instructor/state"),
    api("/instructor/curriculum"),
    api("/instructor/assignment-templates"),
  ]);
  return { ...state, topics, assignmentTemplates };
}

export function saveAssignmentTemplate(values, id) {
  return api(`/instructor/assignment-templates${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: values,
  });
}

export function duplicateAssignmentTemplate(assignmentTemplateId) {
  return api(`/instructor/assignment-templates/${encodeURIComponent(assignmentTemplateId)}/duplicate`, { method: "POST" });
}

export function deliverAssignment(classroomId, values) {
  return api(`/instructor/classes/${encodeURIComponent(classroomId)}/assignment-deliveries`, { method: "POST", body: values });
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

export function closeQuiz(id) {
  return api("/instructor/assignments/" + encodeURIComponent(id) + "/close", { method: "POST" });
}
