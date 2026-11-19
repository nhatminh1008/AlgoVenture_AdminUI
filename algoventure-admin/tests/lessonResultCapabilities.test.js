import { test } from "node:test";
import assert from "node:assert/strict";
import { lessonResultCapabilities } from "../src/features/admin/lessons/lessonResultCapabilities.js";

test("current points formulas are independent of legacy thresholds and scoring versions", () => {
  const insertion = lessonResultCapabilities({
    id: "insertion", scoring: { version: 1, pointsPerStep: 80 }, hasOfficialResult: true,
  });
  assert.match(insertion.pointRule[1], /100 × valid steps − 25 × verified errors/);
  assert.equal(insertion.official, true);
  assert.match(lessonResultCapabilities({ id: "quick" }).pointRule[1], /valid pivot selections/);
  assert.match(lessonResultCapabilities({ id: "queue-dequeue" }).pointRule[1], /valid steps/);
  assert.match(lessonResultCapabilities({ id: "bst-search" }).pointRule[1], /errors in the final stage/);
  assert.match(lessonResultCapabilities({ id: "tree-bfs" }).pointRule[1], /nodes in the final stage/);
});

test("official stars can be returned even for lessons with no points formula", () => {
  for (const id of ["bubble", "matrix", "matrix-transpose", "matrix-spiral", "matrix-bfs", "matrix-dfs",
    "linked-list", "linked-traversal", "linked-search", "linked-insertion", "linked-deletion", "linked-reversal", "graph-basics"]) {
    const result = lessonResultCapabilities({ id, hasOfficialResult: true, hasScoreThresholds: true });
    assert.equal(result.pointRule, null, id);
    assert.equal(result.official, true, id);
    assert.equal(result.usesFinalStageTiming, id.startsWith("matrix"), id);
  }
  assert.equal(lessonResultCapabilities({ id: "insertion", scoring: { version: 1 } }).official, false);
});

test("all tree courses use final-stage timing, while mixed challenges retain their legacy formula", () => {
  for (const id of ["tree-basics", "bst-search", "bst-insert", "bst-delete", "tree-dfs", "tree-bfs"]) {
    assert.equal(lessonResultCapabilities({ id }).usesFinalStageTiming, true, id);
  }
  for (const id of ["stack-mixed", "queue-mixed"]) {
    const result = lessonResultCapabilities({ id });
    assert.equal(result.usesFinalStageTiming, false, id);
    assert.match(result.pointRule[1], /300 \/ 500 \/ 1,200/);
    assert.match(result.legacyPointRule[1], /100 × valid steps/);
  }
});

test("server elapsed-time fallback is limited to Selection, Linear and Tree DFS/BFS", () => {
  for (const id of ["selection", "linear", "tree-dfs", "tree-bfs"]) {
    assert.equal(lessonResultCapabilities({ id }).usesServerTimingFallback, true, id);
  }
  for (const id of ["insertion", "matrix-transpose", "bubble", "binary", "bst-search", "dfs", "bfs"]) {
    assert.equal(lessonResultCapabilities({ id }).usesServerTimingFallback, false, id);
  }
});
