import { PORTAL_POLICY } from "./policy.js";
import { isISO } from "./dates.js";

export function normalizeInviteCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}
export function validInviteCode(value) {
  return /^[A-Z0-9]{6,8}$/.test(value ?? "");
}
export function generateInviteCode(existing = [], random = Math.random) {
  const used = new Set(existing.map(normalizeInviteCode));
  for (let tries = 0; tries < 200; tries++) {
    const code = Array.from(
      { length: PORTAL_POLICY.inviteCodeLength },
      () =>
        PORTAL_POLICY.inviteAlphabet[
          Math.min(
            PORTAL_POLICY.inviteAlphabet.length - 1,
            Math.floor(random() * PORTAL_POLICY.inviteAlphabet.length),
          )
        ],
    ).join("");
    if (!used.has(code)) return code;
  }
  throw new Error("Không tạo được mã mời duy nhất. Vui lòng thử lại.");
}
export function createQuestion(id = () => crypto.randomUUID()) {
  return {
    id: id(),
    prompt: "",
    options: Array(PORTAL_POLICY.optionsPerQuestion).fill(""),
    correctIndex: -1,
    explanation: "",
  };
}
export function validateClassroom(input, others = [], id) {
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > 100
  )
    return "Tên lớp cần có từ 1 đến 100 ký tự.";
  if (
    others.some(
      (item) =>
        item.id !== id &&
        item.title.trim().toLocaleLowerCase() ===
          input.title.trim().toLocaleLowerCase(),
    )
  )
    return "Bạn đã có lớp cùng tên.";
  if (
    input.description != null &&
    (typeof input.description !== "string" || input.description.length > 500)
  )
    return "Mô tả lớp tối đa 500 ký tự.";
  if (
    [input.topicId, input.level].some(
      (value) =>
        value != null && (typeof value !== "string" || value.length > 80),
    )
  )
    return "Thông tin chủ đề hoặc mức độ không hợp lệ.";
  return "";
}
export function validateQuestion(question, complete = true) {
  if (!question || typeof question.id !== "string" || !question.id)
    return "Mã câu hỏi không hợp lệ.";
  if (
    typeof question.prompt !== "string" ||
    question.prompt.length > 2000 ||
    (complete && !question.prompt.trim())
  )
    return "Nội dung câu hỏi cần có từ 1 đến 2000 ký tự.";
  if (
    !Array.isArray(question.options) ||
    question.options.some(
      (option) => typeof option !== "string" || option.length > 500,
    )
  )
    return "Mỗi lựa chọn tối đa 500 ký tự.";
  if (
    question.options.length !== PORTAL_POLICY.optionsPerQuestion &&
    (complete || !question.migrationInvalid)
  )
    return `Mỗi câu cần đúng ${PORTAL_POLICY.optionsPerQuestion} lựa chọn.`;
  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < (complete ? 0 : -1) ||
    question.correctIndex >= question.options.length
  )
    return "Chọn một đáp án đúng hợp lệ.";
  if (complete && question.options.some((option) => !option.trim()))
    return "Nhập nội dung cho cả bốn lựa chọn.";
  if (
    complete &&
    new Set(question.options.map((option) => option.trim().toLocaleLowerCase()))
      .size !== question.options.length
  )
    return "Các lựa chọn không được trùng nhau.";
  if (
    typeof question.explanation !== "string" ||
    question.explanation.length > 2000 ||
    (complete &&
      PORTAL_POLICY.explanationRequired &&
      !question.explanation.trim())
  )
    return "Giải thích đáp án cần có từ 1 đến 2000 ký tự.";
  return "";
}
export function validateAssignment(
  input,
  { now = () => new Date(), publishing = false } = {},
) {
  if (typeof input.classroomId !== "string" || !input.classroomId)
    return "Vui lòng chọn lớp học.";
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > 100
  )
    return "Tên bài tập cần có từ 1 đến 100 ký tự.";
  if (
    input.description != null &&
    (typeof input.description !== "string" || input.description.length > 1000)
  )
    return "Hướng dẫn tối đa 1000 ký tự.";
  if (!["draft", "published"].includes(input.status))
    return "Trạng thái bài tập không hợp lệ.";
  const complete = input.status === "published";
  if ((complete && !isISO(input.dueAt)) || (input.dueAt && !isISO(input.dueAt)))
    return "Bài tập đã giao cần có hạn hoàn thành (ngày và giờ).";
  if (publishing && complete && Date.parse(input.dueAt) <= now().getTime())
    return "Hạn hoàn thành phải ở tương lai khi giao bài hoặc đổi hạn.";
  if (
    !Array.isArray(input.questions) ||
    input.questions.length > PORTAL_POLICY.maxQuestions ||
    (complete && !input.questions.length)
  )
    return `Cần từ 1 đến ${PORTAL_POLICY.maxQuestions} câu hỏi để giao bài.`;
  const seen = new Set();
  for (const [index, question] of input.questions.entries()) {
    const error = validateQuestion(question, complete);
    if (error) return `Câu ${index + 1}: ${error}`;
    if (seen.has(question.id)) return "Mã câu hỏi bị trùng.";
    seen.add(question.id);
  }
  return "";
}
export function questionsLocked(attempts) {
  return PORTAL_POLICY.lockQuestionsAfterFirstAttempt && attempts.length > 0;
}
export function canDeleteAssignment(assignment, attempts) {
  return (
    assignment.status === "draft" ||
    (PORTAL_POLICY.allowPublishedDeletionWithoutAttempts &&
      attempts.length === 0)
  );
}
