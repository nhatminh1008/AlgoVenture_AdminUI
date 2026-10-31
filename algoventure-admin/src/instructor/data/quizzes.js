export const MAX_QUESTIONS = 50;
export function createQuestion() {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    options: Array.from({ length: 4 }, () => ({
      id: crypto.randomUUID(),
      text: "",
    })),
    correctOptionId: "",
    explanation: "",
    points: 1,
  };
}

export function validateQuiz(quiz, classroom) {
  if (!classroom || quiz.classId !== classroom.id)
    return "Không tìm thấy lớp bạn phụ trách.";
  if (
    typeof quiz.title !== "string" ||
    !quiz.title.trim() ||
    quiz.title.trim().length > 100
  )
    return "Tên bộ câu hỏi cần có từ 1 đến 100 ký tự.";
  if (typeof quiz.description !== "string" || quiz.description.length > 1000)
    return "Hướng dẫn tối đa 1000 ký tự.";
  if (!["Draft", "Published"].includes(quiz.status))
    return "Trạng thái bộ câu hỏi không hợp lệ.";
  if (
    !Array.isArray(quiz.materialIds) ||
    quiz.materialIds.some((id) => typeof id !== "string") ||
    new Set(quiz.materialIds).size !== quiz.materialIds.length
  )
    return "Danh sách tài liệu không hợp lệ.";
  if (
    quiz.due &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(quiz.due) ||
      !Number.isFinite(Date.parse(quiz.due)) ||
      new Date(quiz.due).toISOString().slice(0, 10) !== quiz.due)
  )
    return "Hạn hoàn thành không hợp lệ.";
  if (!Array.isArray(quiz.questions) || quiz.questions.length > MAX_QUESTIONS)
    return `Mỗi bộ có tối đa ${MAX_QUESTIONS} câu hỏi.`;
  if (quiz.status === "Published" && !quiz.questions.length)
    return "Thêm ít nhất một câu hỏi trước khi giao cho lớp.";
  const ids = new Set();
  for (const [index, question] of quiz.questions.entries()) {
    const prefix = `Câu ${index + 1}: `;
    if (
      !question ||
      typeof question.id !== "string" ||
      !question.id ||
      ids.has(question.id)
    )
      return prefix + "mã câu hỏi không hợp lệ.";
    ids.add(question.id);
    if (
      typeof question.prompt !== "string" ||
      question.prompt.length > 2000 ||
      typeof question.explanation !== "string" ||
      question.explanation.length > 2000
    )
      return prefix + "nội dung và giải thích tối đa 2000 ký tự.";
    if (
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 6
    )
      return prefix + "cần từ 2 đến 6 lựa chọn.";
    const optionIds = new Set();
    for (const option of question.options) {
      if (
        !option ||
        typeof option.id !== "string" ||
        !option.id ||
        optionIds.has(option.id) ||
        typeof option.text !== "string" ||
        option.text.length > 500
      )
        return prefix + "lựa chọn không hợp lệ hoặc vượt quá 500 ký tự.";
      optionIds.add(option.id);
    }
    if (
      question.correctOptionId !== "" &&
      !optionIds.has(question.correctOptionId)
    )
      return prefix + "đáp án đúng không còn trong các lựa chọn.";
    if (
      !Number.isInteger(question.points) ||
      question.points < 1 ||
      question.points > 20
    )
      return prefix + "điểm phải là số nguyên từ 1 đến 20.";
    if (quiz.status === "Published") {
      if (!question.prompt.trim()) return prefix + "nhập nội dung câu hỏi.";
      if (question.options.some((option) => !option.text.trim()))
        return prefix + "nhập nội dung cho tất cả lựa chọn.";
      if (
        new Set(
          question.options.map((option) =>
            option.text.trim().toLocaleLowerCase(),
          ),
        ).size !== question.options.length
      )
        return prefix + "các lựa chọn không được trùng nhau.";
      if (!question.correctOptionId) return prefix + "chọn một đáp án đúng.";
    }
  }
  return "";
}

export function gradeQuiz(quiz, answers) {
  const error = validateQuiz(
    { ...quiz, status: "Published" },
    { id: quiz.classId },
  );
  if (error) throw new Error(error);
  const results = quiz.questions.map((question) => ({
    questionId: question.id,
    correct: answers[question.id] === question.correctOptionId,
    points:
      answers[question.id] === question.correctOptionId ? question.points : 0,
    maxPoints: question.points,
  }));
  return {
    results,
    score: results.reduce((sum, result) => sum + result.points, 0),
    maxScore: results.reduce((sum, result) => sum + result.maxPoints, 0),
    correctCount: results.filter((result) => result.correct).length,
  };
}
