import { createLocalRepository } from "../src/data/localRepository.js";
export const session = {
  userId: "instructor-demo",
  name: "Elena Rostova",
  role: "INSTRUCTOR",
};
export const now = () => new Date("2026-10-31T05:00:00.000Z");
export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
export function fixtureAssignment(overrides = {}) {
  return {
    id: "test-assignment",
    classroomId: "sorting-basic",
    title: "Bài tập kiểm thử",
    description: "",
    dueAt: "2026-11-01T16:59:00.000Z",
    status: "published",
    questions: [0, 1, 2].map((index) => ({
      id: `q${index}`,
      prompt: `Câu ${index + 1}`,
      options: ["Một", "Hai", "Ba", "Bốn"],
      correctIndex: index,
      explanation: "Giải thích một câu.",
    })),
    ...overrides,
  };
}
export function repo(storage = memoryStorage(), options = {}) {
  let sequence = 0;
  return createLocalRepository({
    storage,
    session,
    now,
    id: () => `new-id-${++sequence}`,
    ...options,
  });
}
