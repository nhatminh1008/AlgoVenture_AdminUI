import { createContext, useContext, useEffect, useState } from "react";
import { validateQuiz } from "./quizzes";
import { listMaterials } from "./materials";
import {
  instructor,
  loadClassrooms,
  STORAGE_KEY,
  validateClass,
  validateAssignment,
} from "./classroom";

const ClassroomContext = createContext(null);
export function ClassroomProvider({ children }) {
  const [loaded] = useState(() =>
    loadClassrooms({ getItem: (key) => window.localStorage.getItem(key) }),
  );
  const [data, setData] = useState(loaded.data);
  const [storageError, setStorageError] = useState(loaded.error);
  useEffect(() => {
    function sync(event) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      const next = loadClassrooms({
        getItem: (key) => window.localStorage.getItem(key),
      });
      if (!next.error) setData(next.data);
      setStorageError(next.error);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const classes = data.classes.filter(
    (item) => item.instructorId === instructor.id,
  );
  const classIds = new Set(classes.map((item) => item.id));
  function persist(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setStorageError("");
    } catch {
      const message =
        "Không lưu được thay đổi. Hãy cho phép lưu trữ hoặc giải phóng dung lượng rồi thử lại.";
      setStorageError(message);
      throw new Error(message);
    }
  }
  function saveClass(values, id) {
    const existing = classes.find((item) => item.id === id);
    if (id && !existing) throw new Error("Không tìm thấy lớp của bạn.");
    const error = validateClass(values, classes, id);
    if (error) throw new Error(error);
    if (
      existing &&
      existing.topicId !== values.topicId &&
      (data.assignments.some((item) => item.classId === id) ||
        data.quizzes.some((item) => item.classId === id))
    )
      throw new Error(
        "Lớp đã có bộ bài. Hãy giữ chủ đề hoặc tạo lớp mới để bảo toàn nội dung đã giao.",
      );
    const classroom = {
      ...existing,
      id: id ?? crypto.randomUUID(),
      instructorId: instructor.id,
      name: values.name.trim(),
      description: values.description.trim(),
      topicId: values.topicId,
      level: values.level,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    persist({
      ...data,
      classes: id
        ? data.classes.map((item) => (item.id === id ? classroom : item))
        : [...data.classes, classroom],
    });
    return classroom;
  }
  function saveAssignment(values, id) {
    const classroom = classes.find((item) => item.id === values.classId);
    const error = validateAssignment(values, classroom);
    if (error) throw new Error(error);
    const existing = data.assignments.find(
      (item) => item.id === id && classIds.has(item.classId),
    );
    if (id && (!existing || existing.status !== "Draft"))
      throw new Error("Chỉ có thể sửa bộ bài ở trạng thái bản nháp.");
    const assignment = {
      ...values,
      title: values.title.trim(),
      id: id ?? crypto.randomUUID(),
    };
    persist({
      ...data,
      assignments: id
        ? data.assignments.map((item) => (item.id === id ? assignment : item))
        : [...data.assignments, assignment],
    });
    return assignment;
  }
  async function saveQuiz(values, id) {
    const classroom = classes.find((item) => item.id === values.classId);
    const error = validateQuiz(values, classroom);
    if (error) throw new Error(error);
    const existing = data.quizzes.find(
      (item) => item.id === id && classIds.has(item.classId),
    );
    if (
      id &&
      (!existing ||
        existing.classId !== classroom.id ||
        existing.status !== "Draft")
    )
      throw new Error("Chỉ có thể sửa bản nháp của lớp này.");
    if (values.materialIds.length) {
      const available = await listMaterials(classroom.id, instructor.id);
      if (
        values.materialIds.some(
          (materialId) => !available.some((item) => item.id === materialId),
        )
      )
        throw new Error(
          "Một tài liệu đính kèm không còn tồn tại trong lớp. Hãy kiểm tra lại.",
        );
    }
    const now = new Date().toISOString();
    const quiz = {
      ...values,
      id: id ?? crypto.randomUUID(),
      title: values.title.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    persist({
      ...data,
      quizzes: id
        ? data.quizzes.map((item) => (item.id === id ? quiz : item))
        : [...data.quizzes, quiz],
    });
    return quiz;
  }
  function removeQuiz(id) {
    const quiz = data.quizzes.find(
      (item) => item.id === id && classIds.has(item.classId),
    );
    if (!quiz || quiz.status !== "Draft")
      throw new Error("Chỉ có thể xóa bản nháp của lớp bạn phụ trách.");
    persist({
      ...data,
      quizzes: data.quizzes.filter((item) => item.id !== id),
    });
  }
  return (
    <ClassroomContext.Provider
      value={{
        instructor,
        classes,
        students: data.students.filter((item) => classIds.has(item.classId)),
        assignments: data.assignments.filter((item) =>
          classIds.has(item.classId),
        ),
        storageError,
        quizzes: data.quizzes.filter((item) => classIds.has(item.classId)),
        saveClass,
        saveAssignment,
        saveQuiz,
        removeQuiz,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}
export function useClassrooms() {
  return useContext(ClassroomContext);
}
