import { getTopic, getLevel } from "./curriculum.js";
import { validateQuiz } from "./quizzes.js";

export const instructor = { id: "instructor-demo", name: "Elena Rostova" };
export const STORAGE_KEY = "algoventure.instructor.classrooms.v1";
export const initialData = {
  quizzes: [],
  classes: [
    {
      id: "sorting-basic",
      instructorId: instructor.id,
      name: "DSA 2026 — Sorting Foundations",
      topicId: "sorting",
      level: "basic",
      description:
        "Luyện tập năm thuật toán sắp xếp thông qua các thử thách tương tác.",
      createdAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "structures-basic",
      instructorId: instructor.id,
      name: "DSA 2026 — Data Structures",
      topicId: "data-structures",
      level: "basic",
      description: "Khám phá Stack, Queue, Linked List và Tree/BST.",
      createdAt: "2026-10-05T00:00:00Z",
    },
    {
      id: "graphs-advanced",
      instructorId: instructor.id,
      name: "DSA 2026 — Graph Exploration",
      topicId: "graphs",
      level: "advanced",
      description: "Thực hành duyệt đồ thị và tìm đường đi ngắn nhất.",
      createdAt: "2026-10-10T00:00:00Z",
    },
  ],
  assignments: [
    {
      id: "sorting-week-3",
      classId: "sorting-basic",
      title: "Sorting Sprint — Tuần 3",
      description: "Thực hành so sánh và đổi chỗ.",
      lessonIds: ["bubble", "selection", "insertion"],
      status: "Active",
      due: "2026-10-28",
    },
    {
      id: "structures-week-1",
      classId: "structures-basic",
      title: "Stack & Queue — Bước đầu",
      description: "",
      lessonIds: ["stack", "queue"],
      status: "Draft",
      due: "2026-11-02",
    },
    {
      id: "graph-traversal",
      classId: "graphs-advanced",
      title: "Khám phá BFS và DFS",
      description: "",
      lessonIds: ["bfs", "dfs"],
      status: "Active",
      due: "2026-11-06",
    },
  ],
  // Illustrative scores only. Not completion rates or Knowledge Tracing estimates.
  students: [
    {
      id: "s1",
      classId: "sorting-basic",
      name: "Nguyễn Hoàng Anh",
      email: "hoanganh@example.com",
      sampleScore: 88,
    },
    {
      id: "s2",
      classId: "sorting-basic",
      name: "Trần Minh Đức",
      email: "minhduc@example.com",
      sampleScore: 74,
    },
    {
      id: "s3",
      classId: "sorting-basic",
      name: "Phan Thanh Thảo",
      email: "thanhthao@example.com",
      sampleScore: 46,
    },
    {
      id: "s4",
      classId: "structures-basic",
      name: "Lê Quốc Khánh",
      email: "quockhanh@example.com",
      sampleScore: 66,
    },
    {
      id: "s5",
      classId: "structures-basic",
      name: "Nguyễn Thị Mai",
      email: "thimai@example.com",
      sampleScore: null,
    },
    {
      id: "s6",
      classId: "structures-basic",
      name: "Võ Đình Linh",
      email: "dinhlinh@example.com",
      sampleScore: 80,
    },
    {
      id: "s7",
      classId: "graphs-advanced",
      name: "Trần Gia Hân",
      email: "giahan@example.com",
      sampleScore: 70,
    },
    {
      id: "s8",
      classId: "graphs-advanced",
      name: "Lê Minh Khang",
      email: "minhkhang@example.com",
      sampleScore: null,
    },
  ],
};

export function validateClass(values, classes, editingId) {
  if (
    typeof values.name !== "string" ||
    !values.name.trim() ||
    values.name.trim().length > 100
  )
    return "Tên lớp cần có từ 1 đến 100 ký tự.";
  if (!getTopic(values.topicId)) return "Vui lòng chọn một chủ đề hợp lệ.";
  if (!getLevel(values.level)) return "Vui lòng chọn mức Basic hoặc Advanced.";
  if (typeof values.description !== "string" || values.description.length > 500)
    return "Mô tả tối đa 500 ký tự.";
  if (
    classes.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().toLocaleLowerCase() ===
          values.name.trim().toLocaleLowerCase(),
    )
  )
    return "Bạn đã có lớp cùng tên. Vui lòng chọn tên khác.";
  return "";
}

export function validateAssignment(values, classroom) {
  if (!classroom) return "Vui lòng chọn lớp của bạn.";
  if (
    typeof values.title !== "string" ||
    !values.title.trim() ||
    values.title.trim().length > 100
  )
    return "Tên bộ bài cần có từ 1 đến 100 ký tự.";
  if (
    typeof values.description !== "string" ||
    values.description.length > 1000
  )
    return "Hướng dẫn tối đa 1000 ký tự.";
  const allowed = new Set(
    getTopic(classroom.topicId).lessons.map(([id]) => id),
  );
  if (
    !Array.isArray(values.lessonIds) ||
    !values.lessonIds.length ||
    new Set(values.lessonIds).size !== values.lessonIds.length ||
    values.lessonIds.some((id) => !allowed.has(id))
  )
    return "Chọn ít nhất một bài thuộc chủ đề của lớp.";
  if (!["Draft", "Active", "Closed"].includes(values.status))
    return "Trạng thái bài giao không hợp lệ.";
  if (values.status === "Active" && !values.due)
    return "Vui lòng đặt hạn hoàn thành trước khi giao bài.";
  if (values.due && !/^\d{4}-\d{2}-\d{2}$/.test(values.due))
    return "Ngày hoàn thành không hợp lệ.";
  return "";
}

export function loadClassrooms(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: initialData, error: "" };
    const data = JSON.parse(raw);
    if (
      !Array.isArray(data.classes) ||
      !Array.isArray(data.assignments) ||
      !Array.isArray(data.students)
    )
      throw new Error("Invalid data");
    if (
      data.classes.some(
        (item) =>
          !item ||
          !item.id ||
          !item.instructorId ||
          validateClass(item, [], item.id),
      )
    )
      throw new Error("Invalid class");
    if (
      data.assignments.some(
        (item) =>
          !item ||
          !item.id ||
          validateAssignment(
            item,
            data.classes.find((c) => c.id === item.classId),
          ),
      )
    )
      throw new Error("Invalid assignment");
    if (
      data.students.some(
        (item) =>
          !item ||
          !item.id ||
          !item.name ||
          !item.email ||
          !data.classes.some((c) => c.id === item.classId) ||
          !(
            item.sampleScore === null ||
            (Number.isFinite(item.sampleScore) &&
              item.sampleScore >= 0 &&
              item.sampleScore <= 100)
          ),
      )
    )
      throw new Error("Invalid student");
    // Preserve classes saved before the quiz feature was added.
    data.quizzes ??= [];
    if (
      !Array.isArray(data.quizzes) ||
      data.quizzes.some(
        (item) =>
          !item ||
          !item.id ||
          validateQuiz(
            item,
            data.classes.find((classroom) => classroom.id === item.classId),
          ),
      )
    )
      throw new Error("Invalid quiz");
    return { data, error: "" };
  } catch {
    return {
      data: initialData,
      error:
        "Không đọc được dữ liệu đã lưu. Đang hiển thị dữ liệu mẫu; hãy kiểm tra quyền lưu trữ của trình duyệt.",
    };
  }
}

export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function downloadFile(content, name, type = "text/csv;charset=utf-8;") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportStudentRows(rows, classes) {
  const records = rows.map((row) => [
    row.name,
    row.email,
    classes.find((c) => c.id === row.classId)?.name,
    row.sampleScore,
  ]);
  return (
    "\uFEFF" +
    [["Họ tên", "Email", "Lớp", "Điểm minh họa / 100"], ...records]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}
