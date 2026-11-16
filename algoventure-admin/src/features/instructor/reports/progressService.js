import { api } from "../../../api/apiClient";

export function studentProgressPath(classId, enrollmentId) {
  return `/instructor/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(enrollmentId)}`;
}

export function studentAssignmentPath(classId, enrollmentId, assignmentId) {
  return `${studentProgressPath(classId, enrollmentId)}/assignments/${encodeURIComponent(assignmentId)}`;
}

export function getStudentProgress(path) {
  return api(`${path}/progress`);
}

export function getStudentAssignment(path) {
  return api(path);
}

export function getQuizResults(classId, quizId, page) {
  return api(`/instructor/classes/${encodeURIComponent(classId)}/quizzes/${encodeURIComponent(quizId)}/results?page=${page}`);
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
