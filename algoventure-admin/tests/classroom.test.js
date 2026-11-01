import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/instructor/data/curriculum.js";
import {
  csvCell,
  exportStudentRows,
} from "../src/instructor/data/classroom.js";
test("curriculum preserves 25 unique learner-game lesson IDs", () => {
  const ids = topics.flatMap((t) => t.lessons.map(([id]) => id));
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
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
