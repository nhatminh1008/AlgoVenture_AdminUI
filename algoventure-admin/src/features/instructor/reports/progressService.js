import { api } from "../../../api/apiClient";

export function studentProgressPath(classId, enrollmentId) {
  return `/instructor/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(enrollmentId)}`;
}

export function studentAssignmentPath(classId, enrollmentId, assignmentId) {
  return `${studentProgressPath(classId, enrollmentId)}/assignments/${encodeURIComponent(assignmentId)}`;
}

export function getStudentProgress(path, quizId) {
  return api(`${path}/progress${quizId ? `?${new URLSearchParams({ quizId })}` : ""}`);
}

export function getStudentAssignment(path) {
  return api(path);
}

export function getAssignmentResults(classId, assignmentId, page, q) {
  return getWorkResults(classId, "assignments", assignmentId, page, q);
}

export function getQuizResults(classId, quizId, page, q) {
  return getWorkResults(classId, "quizzes", quizId, page, q);
}

function getWorkResults(classId, kind, id, page, q) {
  const params = new URLSearchParams({ page });
  if (q) params.set("q", q);
  return api(`/instructor/classes/${encodeURIComponent(classId)}/${kind}/${encodeURIComponent(id)}/results?${params}`);
}

export function getQuizQuestionResults(classId, quizId) {
  return api(`/instructor/classes/${encodeURIComponent(classId)}/quizzes/${encodeURIComponent(quizId)}/results/questions`);
}

export function getStudentQuiz(path, page) {
  return api(`${path}?page=${page}`);
}

export function getQuizAttempt(path, attemptId) {
  return api(`${path}/attempts/${encodeURIComponent(attemptId)}`);
}
