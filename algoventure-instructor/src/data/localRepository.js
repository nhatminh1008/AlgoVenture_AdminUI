import { ClassroomRepoError } from "./errors.js";
import {
  validateClassroom,
  validateAssignment,
  normalizeInviteCode,
  validInviteCode,
  generateInviteCode,
  questionsLocked,
  canDeleteAssignment,
} from "./validators.js";
import { isISO } from "./dates.js";
import { gradeAttempt } from "./metrics.js";
import { createSeed } from "./seed.js";
import { migrateV1 } from "./migration.js";
import { PORTAL_POLICY } from "./policy.js";

export const STORAGE_KEY = "algoventure.instructor.classrooms.v2";
export const LEGACY_KEY = "algoventure.instructor.classrooms.v1";

export function sanitizeData(raw) {
  const notices = Array.isArray(raw.notices)
    ? raw.notices.filter((item) => typeof item === "string")
    : [];
  let dropped = 0;
  const unique = new Set();
  const classrooms = [];
  for (const item of raw.classrooms) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id ||
      unique.has(item.id) ||
      typeof item.instructorId !== "string" ||
      !item.instructorId ||
      typeof item.instructorName !== "string" ||
      !validInviteCode(item.inviteCode) ||
      classrooms.some(
        (c) => c.inviteCode === normalizeInviteCode(item.inviteCode),
      ) ||
      validateClassroom(
        item,
        classrooms.filter((c) => c.instructorId === item.instructorId),
        item.id,
      )
    ) {
      dropped++;
      continue;
    }
    classrooms.push({
      ...item,
      inviteCode: normalizeInviteCode(item.inviteCode),
    });
    unique.add(item.id);
  }
  const enrollments = [];
  for (const item of raw.enrollments) {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.learnerId !== "string" ||
      !item.learnerId ||
      typeof item.learnerName !== "string" ||
      !item.learnerName.trim() ||
      typeof item.learnerEmail !== "string" ||
      !item.learnerEmail.trim() ||
      !isISO(item.joinedAt) ||
      !classrooms.some((c) => c.id === item.classroomId) ||
      enrollments.some(
        (e) =>
          e.id === item.id ||
          (e.classroomId === item.classroomId &&
            e.learnerId === item.learnerId),
      )
    ) {
      dropped++;
      continue;
    }
    enrollments.push(item);
  }
  const assignments = [];
  for (const item of raw.assignments) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id ||
      assignments.some((a) => a.id === item.id) ||
      !classrooms.some((c) => c.id === item.classroomId) ||
      validateAssignment(item)
    ) {
      dropped++;
      continue;
    }
    assignments.push({
      ...item,
      dueAt: item.dueAt ? new Date(item.dueAt).toISOString() : "",
    });
  }
  const attempts = [];
  for (const item of raw.attempts) {
    const assignment = assignments.find(
      (a) => a.id === item?.assignmentId && a.status === "published",
    );
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id ||
      attempts.some((a) => a.id === item.id) ||
      !assignment ||
      !isISO(item.submittedAt) ||
      !enrollments.some(
        (e) =>
          e.classroomId === assignment.classroomId &&
          e.learnerId === item.learnerId,
      ) ||
      !Array.isArray(item.answers) ||
      item.answers.some(
        (a) =>
          !a ||
          !assignment.questions.some((q) => q.id === a.questionId) ||
          !(
            a.selectedIndex === null ||
            (Number.isInteger(a.selectedIndex) &&
              a.selectedIndex >= 0 &&
              a.selectedIndex < PORTAL_POLICY.optionsPerQuestion)
          ),
      ) ||
      new Set(item.answers.map((a) => a.questionId)).size !==
        item.answers.length
    ) {
      dropped++;
      continue;
    }
    attempts.push({
      id: item.id,
      assignmentId: item.assignmentId,
      learnerId: item.learnerId,
      submittedAt: item.submittedAt,
      ...gradeAttempt(assignment, item.answers),
    });
  }
  if (dropped)
    notices.push(
      `Đã bỏ qua ${dropped} bản ghi không hợp lệ; các bản ghi hợp lệ được giữ lại.`,
    );
  return {
    version: 2,
    classrooms,
    enrollments,
    assignments,
    attempts,
    notices: [...new Set(notices)],
  };
}

export function createLocalRepository({
  storage,
  session,
  now = () => new Date(),
  random = Math.random,
  id = () => crypto.randomUUID(),
  events = globalThis.window,
} = {}) {
  let notices = [];
  function checkSession() {
    if (session?.role !== "INSTRUCTOR" || !session?.userId)
      throw new ClassroomRepoError("FORBIDDEN");
  }
  function write(data) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new ClassroomRepoError("STORAGE");
    }
  }
  function backup(raw) {
    try {
      let key = `${STORAGE_KEY}.corrupt-${now().getTime()}`;
      let suffix = 0;
      while (storage.getItem(key) !== null)
        key = `${STORAGE_KEY}.corrupt-${now().getTime()}-${++suffix}`;
      storage.setItem(key, raw); // Failure must prevent replacement of the unreadable original.
    } catch {
      throw new ClassroomRepoError(
        "STORAGE",
        "Không tạo được bản sao dữ liệu lỗi; dữ liệu gốc chưa bị thay thế.",
      );
    }
  }
  function read() {
    checkSession();
    let raw, legacy;
    try {
      raw = storage.getItem(STORAGE_KEY);
      if (raw === null) legacy = storage.getItem(LEGACY_KEY);
    } catch {
      throw new ClassroomRepoError("STORAGE");
    }
    let data;
    if (raw === null && legacy !== null && legacy !== undefined) {
      try {
        const old = JSON.parse(legacy);
        if (!old || !Array.isArray(old.classes)) throw new Error();
        data = sanitizeData(migrateV1(old, { now, session, random }));
      } catch {
        backup(legacy);
        data = createSeed(now, session);
        data.notices.push(
          "Dữ liệu cũ không đọc được đã được sao lưu trước khi tạo dữ liệu ban đầu.",
        );
      }
      write(data);
    } else if (raw === null) {
      data = createSeed(now, session);
      write(data);
    } else {
      let parsed;
      try {
        parsed = JSON.parse(raw);
        if (
          !parsed ||
          parsed.version !== 2 ||
          !["classrooms", "enrollments", "assignments", "attempts"].every(
            (key) => Array.isArray(parsed[key]),
          )
        )
          throw new Error();
      } catch {
        backup(raw);
        data = createSeed(now, session);
        data.notices.push(
          "Dữ liệu v2 không đọc được đã được sao lưu trước khi tạo dữ liệu ban đầu.",
        );
        write(data);
      }
      if (parsed && !data) data = sanitizeData(parsed);
    }
    notices = data.notices;
    return data;
  }
  function own(data, classId) {
    const classroom = data.classrooms.find((item) => item.id === classId);
    if (!classroom) throw new ClassroomRepoError("NOT_FOUND");
    if (classroom.instructorId !== session.userId)
      throw new ClassroomRepoError("FORBIDDEN");
    return classroom;
  }
  function assignmentOf(data, assignmentId) {
    const assignment = data.assignments.find(
      (item) => item.id === assignmentId,
    );
    if (!assignment) throw new ClassroomRepoError("NOT_FOUND");
    own(data, assignment.classroomId);
    return assignment;
  }
  const clone = (value) => structuredClone(value);
  return {
    async listClassrooms() {
      return clone(
        read().classrooms.filter(
          (item) => item.instructorId === session.userId,
        ),
      );
    },
    async getClassroom(classId) {
      const data = read();
      return clone(own(data, classId));
    },
    async createClassroom(input) {
      const data = read();
      const error = validateClassroom(
        input,
        data.classrooms.filter((item) => item.instructorId === session.userId),
      );
      if (error) throw new ClassroomRepoError("VALIDATION", error);
      const classroom = {
        id: id(),
        instructorId: session.userId,
        instructorName: session.name,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        topicId: input.topicId ?? "",
        level: input.level ?? "",
        inviteCode: generateInviteCode(
          data.classrooms.map((item) => item.inviteCode),
          random,
        ),
        createdAt: now().toISOString(),
      };
      data.classrooms.push(classroom);
      write(data);
      return clone(classroom);
    },
    async updateClassroom(classId, input) {
      const data = read();
      const current = own(data, classId);
      const error = validateClassroom(
        input,
        data.classrooms.filter((item) => item.instructorId === session.userId),
        classId,
      );
      if (error) throw new ClassroomRepoError("VALIDATION", error);
      const next = {
        ...current,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        topicId: input.topicId ?? "",
        level: input.level ?? "",
      };
      data.classrooms = data.classrooms.map((item) =>
        item.id === classId ? next : item,
      );
      write(data);
      return clone(next);
    },
    async deleteClassroom(classId) {
      const data = read();
      own(data, classId);
      const ids = new Set(
        data.assignments
          .filter((item) => item.classroomId === classId)
          .map((item) => item.id),
      );
      data.classrooms = data.classrooms.filter((item) => item.id !== classId);
      data.enrollments = data.enrollments.filter(
        (item) => item.classroomId !== classId,
      );
      data.assignments = data.assignments.filter(
        (item) => item.classroomId !== classId,
      );
      data.attempts = data.attempts.filter(
        (item) => !ids.has(item.assignmentId),
      );
      write(data);
    },
    async listEnrollments(classId) {
      const data = read();
      own(data, classId);
      return clone(
        data.enrollments.filter((item) => item.classroomId === classId),
      );
    },
    async listAssignments(classId) {
      const data = read();
      own(data, classId);
      return clone(
        data.assignments.filter((item) => item.classroomId === classId),
      );
    },
    async getAssignment(assignmentId) {
      const data = read();
      return clone(assignmentOf(data, assignmentId));
    },
    async saveAssignment(input, assignmentId) {
      const data = read();
      own(data, input.classroomId);
      const existing = assignmentId ? assignmentOf(data, assignmentId) : null;
      if (existing && existing.classroomId !== input.classroomId)
        throw new ClassroomRepoError(
          "FORBIDDEN",
          "Không thể chuyển bài tập sang lớp khác.",
        );
      const history = data.attempts.filter(
        (item) => item.assignmentId === assignmentId,
      );
      if (
        questionsLocked(history) &&
        (JSON.stringify(
          existing.questions.map((q) => [
            q.id,
            q.prompt,
            q.options,
            q.correctIndex,
            q.explanation,
          ]),
        ) !==
          JSON.stringify(
            input.questions.map((q) => [
              q.id,
              q.prompt,
              q.options,
              q.correctIndex,
              q.explanation,
            ]),
          ) ||
          input.status !== "published")
      )
        throw new ClassroomRepoError(
          "LOCKED",
          "Bài tập đã có lượt làm: nội dung câu hỏi được khóa, chỉ sửa tên, hướng dẫn và hạn.",
        );
      const publishing =
        input.status === "published" &&
        (!existing ||
          existing.status !== "published" ||
          Date.parse(input.dueAt) !== Date.parse(existing.dueAt));
      const error = validateAssignment(input, { now, publishing });
      if (error) throw new ClassroomRepoError("VALIDATION", error);
      const next = {
        id: assignmentId ?? id(),
        classroomId: input.classroomId,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : "",
        status: input.status,
        questions: input.questions.map(
          ({ id, prompt, options, correctIndex, explanation }) => ({
            id,
            prompt,
            options: [...options],
            correctIndex,
            explanation,
            ...(options.length !== PORTAL_POLICY.optionsPerQuestion
              ? { migrationInvalid: true }
              : {}),
          }),
        ),
        createdAt: existing?.createdAt ?? now().toISOString(),
        updatedAt: now().toISOString(),
      };
      if (existing)
        data.assignments = data.assignments.map((item) =>
          item.id === assignmentId ? next : item,
        );
      else data.assignments.push(next);
      write(data);
      return clone(next);
    },
    async deleteAssignment(assignmentId) {
      const data = read();
      const assignment = assignmentOf(data, assignmentId);
      const history = data.attempts.filter(
        (item) => item.assignmentId === assignmentId,
      );
      if (!canDeleteAssignment(assignment, history))
        throw new ClassroomRepoError(
          "LOCKED",
          "Không thể xóa bài tập đã có lượt làm.",
        );
      data.assignments = data.assignments.filter(
        (item) => item.id !== assignmentId,
      );
      data.attempts = data.attempts.filter(
        (item) => item.assignmentId !== assignmentId,
      );
      write(data);
    },
    async listAttempts({ classroomId, assignmentId } = {}) {
      const data = read();
      own(data, classroomId);
      if (
        assignmentId &&
        assignmentOf(data, assignmentId).classroomId !== classroomId
      )
        throw new ClassroomRepoError("FORBIDDEN");
      const ids = new Set(
        data.assignments
          .filter(
            (item) =>
              item.classroomId === classroomId &&
              item.status === "published" &&
              (!assignmentId || item.id === assignmentId),
          )
          .map((item) => item.id),
      );
      return clone(data.attempts.filter((item) => ids.has(item.assignmentId)));
    },
    getNotices() {
      return [...notices];
    },
    subscribe(listener) {
      const handler = (event) => {
        if (event.key === STORAGE_KEY || event.key === null) listener();
      };
      events?.addEventListener("storage", handler);
      return () => events?.removeEventListener("storage", handler);
    },
  };
}
