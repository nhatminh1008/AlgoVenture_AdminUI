import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from 'node:fs';
import { topics } from "../src/instructor/data/curriculum.js";
import {
  csvCell,
  exportStudentRows,
} from "../src/instructor/data/classroom.js";
test("curriculum matches backend: 29 current lessons and two legacy combined lessons", () => {
  const ids = topics.flatMap((t) => t.lessons.map(([id]) => id));
  const backend = JSON.parse(readFileSync(new URL('../../backend/src/main/resources/curriculum.json', import.meta.url), 'utf8'));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), backend.flatMap(t => t.lessons.map(([id]) => id)).sort());
  assert.equal(ids.filter(id => !['stack', 'queue'].includes(id)).length, 29);
  for (const id of ['stack-push', 'stack-pop', 'stack-peek', 'queue-enqueue', 'queue-dequeue', 'queue-peek', 'stack', 'queue'])
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
