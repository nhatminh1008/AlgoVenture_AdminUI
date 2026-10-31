import { fromDueInput, isISO } from "./dates.js";
import { PORTAL_POLICY } from "./policy.js";
import {
  generateInviteCode,
  validateAssignment,
  validateQuestion,
} from "./validators.js";

export function migrateV1(legacy, { now, session, random = Math.random }) {
  const data = {
    version: 2,
    classrooms: [],
    enrollments: [],
    assignments: [],
    attempts: [],
    notices: [
      "Đã chuyển dữ liệu v1 sang v2; dữ liệu gốc được giữ nguyên. Bài tập cần sửa được giữ ở bản nháp.",
    ],
  };
  for (const item of Array.isArray(legacy.classes) ? legacy.classes : []) {
    if (!item || typeof item.id !== "string" || typeof item.name !== "string")
      continue;
    data.classrooms.push({
      id: item.id,
      title: item.name,
      instructorId: item.instructorId || session.userId,
      instructorName:
        item.instructorName ||
        (item.instructorId === session.userId || !item.instructorId
          ? session.name
          : "Giảng viên"),
      inviteCode: generateInviteCode(
        data.classrooms.map((classroom) => classroom.inviteCode),
        random,
      ),
      description: item.description || "",
      topicId: item.topicId || "",
      level: item.level || "",
      createdAt: isISO(item.createdAt) ? item.createdAt : now().toISOString(),
    });
  }
  for (const student of Array.isArray(legacy.students) ? legacy.students : []) {
    if (
      !student ||
      !data.classrooms.some((item) => item.id === student.classId)
    )
      continue;
    data.enrollments.push({
      id: `migrated-${student.classId}-${student.id}`,
      classroomId: student.classId,
      learnerId: student.id,
      learnerName: student.name,
      learnerEmail: student.email,
      joinedAt: isISO(student.joinedAt)
        ? student.joinedAt
        : now().toISOString(),
    });
  }
  for (const item of Array.isArray(legacy.quizzes) ? legacy.quizzes : []) {
    if (
      !item ||
      !data.classrooms.some((classroom) => classroom.id === item.classId)
    )
      continue;
    const issues = [];
    const questions = (Array.isArray(item.questions) ? item.questions : []).map(
      (oldQuestion, index) => {
        const question =
          oldQuestion && typeof oldQuestion === "object" ? oldQuestion : {};
        const options = (
          Array.isArray(question.options) ? question.options : []
        ).map((option) =>
          typeof option === "string" ? option : String(option?.text ?? ""),
        );
        const correctIndex = Number.isInteger(question.correctIndex)
          ? question.correctIndex
          : (Array.isArray(question.options) ? question.options : []).findIndex(
              (option) => option?.id === question.correctOptionId,
            );
        const converted = {
          id: question.id || `${item.id}-q${index + 1}`,
          prompt: String(question.prompt ?? ""),
          options,
          correctIndex:
            correctIndex >= 0 && correctIndex < options.length
              ? correctIndex
              : -1,
          explanation: String(question.explanation ?? ""),
          ...(options.length !== PORTAL_POLICY.optionsPerQuestion
            ? { migrationInvalid: true }
            : {}),
        };
        const error = validateQuestion(converted);
        if (error) issues.push(`Câu ${index + 1}: ${error}`);
        return converted;
      },
    );
    let dueAt = "";
    try {
      if (item.due)
        dueAt = fromDueInput(`${item.due}T${PORTAL_POLICY.defaultDueTime}`);
    } catch {
      issues.push("Hạn cũ không hợp lệ; vui lòng đặt lại.");
    }
    const converted = {
      id: item.id,
      classroomId: item.classId,
      title: item.title || "Bài tập đã chuyển đổi",
      description: item.description || "",
      dueAt,
      questions,
      status: item.status === "Published" ? "published" : "draft",
      createdAt: isISO(item.createdAt) ? item.createdAt : now().toISOString(),
      updatedAt: now().toISOString(),
      migrationIssues: issues,
    };
    const error = validateAssignment(converted);
    if (error || issues.length) {
      converted.status = "draft";
      if (error && !issues.includes(error))
        converted.migrationIssues.push(error);
    }
    data.assignments.push(converted);
  }
  return data;
}
