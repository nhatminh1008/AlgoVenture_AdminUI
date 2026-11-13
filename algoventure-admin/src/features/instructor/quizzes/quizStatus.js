const QUIZ_STATUS_LABELS = {
  Draft: "Bản nháp",
  Published: "Đã công bố",
  Closed: "Đã đóng",
};

export function getQuizStatusLabel(quiz) {
  return quiz.archivedAt ? "Đã lưu trữ" : QUIZ_STATUS_LABELS[quiz.status] ?? quiz.status;
}

export function canEditQuiz(quiz, classroomArchivedAt) {
  return !classroomArchivedAt && !quiz.archivedAt && quiz.status === "Draft";
}
