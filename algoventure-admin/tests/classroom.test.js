import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCurriculum } from "../src/shared/curriculum/curriculumCatalog.js";
import { english } from "../src/preferences/english.js";
import {
  csvCell,
  exportStudentRows,
} from "../src/features/instructor/reports/studentResultsExport.js";
test("instructor resolves lessons from the backend curriculum, including Matrix", () => {
  const backendCatalog = process.env.BACKEND_CURRICULUM_PATH
    ? resolve(process.env.BACKEND_CURRICULUM_PATH)
    : [
        "../../../AlgoVenture_Backend/src/main/resources/curriculum.json",
        "../../../Backend/src/main/resources/curriculum.json",
        "../../../../Backend_AlgoVenture/AlgoVenture_Backend/src/main/resources/curriculum.json",
        "../../backend/src/main/resources/curriculum.json",
      ].map((path) => new URL(path, import.meta.url)).find((path) => existsSync(path));
  assert.ok(backendCatalog, "Backend curriculum not found. Set BACKEND_CURRICULUM_PATH to curriculum.json.");
  const backend = JSON.parse(readFileSync(backendCatalog, "utf8"));
  const { topics, lessonName } = createCurriculum(backend);
  const ids = topics.flatMap((topic) => topic.lessons.map(([id]) => id));
  const legacyIds = ["stack", "queue", "tree-traversal", "bst"];
  assert.deepEqual(topics, backend, "Portal must use the backend topic metadata, lesson labels and order");
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 36);
  assert.deepEqual(ids.filter((id) => legacyIds.includes(id)), []);
  assert.deepEqual(topics.map(({ label }) => label), ["Array", "Linked List", "Stack", "Queue", "Tree", "Graph"]);
  assert.deepEqual(topics.find(({ id }) => id === "array").lessons.map(([id]) => id), [
    "linear", "binary", "bubble", "selection", "insertion", "merge", "quick",
    "matrix", "matrix-transpose", "matrix-spiral", "matrix-bfs", "matrix-dfs",
  ]);
  assert.equal(lessonName("matrix-bfs"), "BFS trên lưới");
  assert.equal(lessonName("stack"), "stack");
  for (const id of ['stack-push', 'stack-pop', 'stack-peek', 'stack-mixed', 'queue-enqueue', 'queue-dequeue', 'queue-peek', 'queue-mixed', 'tree-dfs', 'tree-bfs'])
    assert.ok(ids.includes(id), `Missing curriculum lesson: ${id}`);
});
test("CSV escapes Unicode and quotes, neutralizes formulas and keeps missing scores empty", () => {
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  const csv = exportStudentRows(
    [
      {
        name: 'Nguyễn, "An"',
        email: "an@example.com",
        classId: "c",
        score: null,
      },
    ],
    [{ id: "c", name: "Sorting" }],
  );
  assert(csv.startsWith("\uFEFF"));
  assert(csv.includes('"Nguyễn, ""An"""'));
  assert(!csv.includes("undefined"));
  assert(csv.includes("Sorting"));
});

test("CSV translates the headers and retains the original student and class data", () => {
  const rows = [{ name: "Nguyễn An", email: "an@example.com", classId: "c", score: 0 }];
  const classes = [{ id: "c", name: "Lớp thử nghiệm" }];
  const [header, row] = exportStudentRows(rows, classes, (label) => english[label] ?? label).split("\r\n");
  assert.equal(header, '\uFEFF"Full name","Email","Class","Quiz score / 100","Quizzes submitted","Practice items completed","Practice items assigned","Progress (%)"');
  assert.equal(row, exportStudentRows(rows, classes).split("\r\n")[1]);
});
