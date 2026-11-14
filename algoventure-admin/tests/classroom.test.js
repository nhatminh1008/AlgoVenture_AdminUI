import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCurriculum } from "../src/shared/curriculum/curriculumCatalog.js";
import {
  csvCell,
  exportStudentRows,
} from "../src/features/instructor/reports/studentResultsExport.js";
test("instructor resolves lessons from the backend curriculum, including Matrix", () => {
  const backendCatalog = process.env.BACKEND_CURRICULUM_PATH
    ? resolve(process.env.BACKEND_CURRICULUM_PATH)
    : [
        "../../../Backend/src/main/resources/curriculum.json",
        "../../../AlgoVenture_Backend/src/main/resources/curriculum.json",
        "../../../../Backend_AlgoVenture/AlgoVenture_Backend/src/main/resources/curriculum.json",
        "../../backend/src/main/resources/curriculum.json",
      ].map((path) => new URL(path, import.meta.url)).find((path) => existsSync(path));
  assert.ok(backendCatalog, "Backend curriculum not found. Set BACKEND_CURRICULUM_PATH to curriculum.json.");
  const backend = JSON.parse(readFileSync(backendCatalog, "utf8"));
  const { topics, getTopic, lessonName } = createCurriculum(backend);
  const ids = topics.flatMap((topic) => topic.lessons.map(([id]) => id));
  const legacyIds = ["stack", "queue", "tree-traversal", "bst"];
<<<<<<< Updated upstream
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.filter((id) => legacyIds.includes(id)), []);
  assert.deepEqual(getTopic("matrix").lessons.map(([id]) => id),
    ["matrix", "matrix-transpose", "matrix-spiral", "matrix-bfs", "matrix-dfs"]);
  assert.equal(lessonName("matrix-bfs"), "BFS trên lưới");
  assert.equal(lessonName("stack"), "stack");
=======
  assert.equal(new Set(backendIds).size, backendIds.length);
  assert.deepEqual([...ids].sort(), [...backendIds].sort());
  assert.deepEqual(topics, backend, "Topic metadata, lesson labels and order must match the backend");
  assert.deepEqual(backendIds.filter(id => legacyIds.includes(id)), []);
  assert.equal(ids.length, 34);
  assert.ok(!ids.includes("stack") && !ids.includes("queue"));
>>>>>>> Stashed changes
  for (const id of ['stack-push', 'stack-pop', 'stack-peek', 'queue-enqueue', 'queue-dequeue', 'queue-peek', 'tree-dfs', 'tree-bfs'])
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
