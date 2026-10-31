import test from "node:test";
import assert from "node:assert/strict";
import {
  createQuestion,
  validateQuiz,
  gradeQuiz,
} from "../src/data/quizzes.js";
import { validateMaterialFile, MAX_FILE_SIZE } from "../src/data/materials.js";
import { initialData, loadClassrooms } from "../src/data/classroom.js";

const classroom = { id: "sorting-basic" };
function fixture() {
  return {
    id: "quiz-1",
    classId: classroom.id,
    title: "Sorting quiz",
    description: "",
    due: "",
    status: "Published",
    materialIds: [],
    questions: [
      {
        id: "q1",
        prompt: "Bubble Sort compares which elements?",
        options: [
          { id: "a", text: "Adjacent elements" },
          { id: "b", text: "Only first and last" },
        ],
        correctOptionId: "a",
        explanation: "It compares neighboring elements.",
        points: 3,
      },
    ],
  };
}
test("drafts can be incomplete while publishing requires complete questions and a correct answer", () => {
  const draft = {
    ...fixture(),
    status: "Draft",
    questions: [createQuestion()],
  };
  assert.equal(validateQuiz(draft, classroom), "");
  assert.notEqual(
    validateQuiz({ ...draft, status: "Published" }, classroom),
    "",
  );
  assert.notEqual(validateQuiz({ ...fixture(), questions: [] }, classroom), "");
  const quiz = fixture();
  quiz.questions[0].correctOptionId = "";
  assert.notEqual(validateQuiz(quiz, classroom), "");
});
test("publishing rejects duplicate choices, invalid points and removed correct answers", () => {
  for (const mutate of [
    (q) => {
      q.options[1].text = " adjacent elements ";
    },
    (q) => {
      q.points = 1.5;
    },
    (q) => {
      q.correctOptionId = "deleted";
    },
    (q) => {
      q.options = [];
    },
    (q) => {
      q.prompt = " ";
    },
  ]) {
    const quiz = fixture();
    mutate(quiz.questions[0]);
    assert.notEqual(validateQuiz(quiz, classroom), "");
  }
});
test("quiz is bound to its class and validates material references and limits", () => {
  assert.notEqual(validateQuiz(fixture(), { id: "another-class" }), "");
  assert.notEqual(
    validateQuiz({ ...fixture(), materialIds: ["same", "same"] }, classroom),
    "",
  );
  assert.notEqual(
    validateQuiz({ ...fixture(), due: "2026-02-31" }, classroom),
    "",
  );
  assert.notEqual(
    validateQuiz(
      { ...fixture(), questions: Array.from({ length: 51 }, createQuestion) },
      classroom,
    ),
    "",
  );
});
test("weighted grading uses stable IDs even after reordering options", () => {
  const quiz = fixture();
  quiz.questions[0].options.reverse();
  quiz.questions.push({
    ...structuredClone(quiz.questions[0]),
    id: "q2",
    points: 2,
  });
  const result = gradeQuiz(quiz, { q1: "a", q2: "b" });
  assert.equal(result.score, 3);
  assert.equal(result.maxScore, 5);
  assert.equal(result.correctCount, 1);
  assert.equal(gradeQuiz(quiz, {}).score, 0);
  assert.equal(gradeQuiz(quiz, { q1: "injected", q2: "injected" }).score, 0);
});
test("old saved classrooms migrate without losing existing classes or assignments", () => {
  const legacy = structuredClone(initialData);
  delete legacy.quizzes;
  const loaded = loadClassrooms({ getItem: () => JSON.stringify(legacy) });
  assert.equal(loaded.error, "");
  assert.deepEqual(loaded.data.quizzes, []);
  assert.deepEqual(loaded.data.classes, initialData.classes);
  const withQuiz = { ...initialData, quizzes: [fixture()] };
  assert.equal(
    loadClassrooms({ getItem: () => JSON.stringify(withQuiz) }).data.quizzes[0]
      .title,
    "Sorting quiz",
  );
});
test("materials accept supported nonempty files up to 10 MB and reject unsafe types", () => {
  for (const name of ["slides.PDF", "lecture.docx", "slides.pptx", "notes.txt"])
    assert.equal(validateMaterialFile({ name, size: MAX_FILE_SIZE }), "");
  for (const file of [
    null,
    { name: "notes.txt", size: 0 },
    { name: "file.pdf.exe", size: 10 },
    { name: "page.html", size: 10 },
    { name: "big.pdf", size: MAX_FILE_SIZE + 1 },
  ])
    assert.notEqual(validateMaterialFile(file), "");
});
