import { test } from "node:test";
import assert from "node:assert/strict";
import { lessonResultCapabilities } from "../src/features/admin/lessons/lessonResultCapabilities.js";

test("lesson capabilities use shared timing for stars and preserve score availability", () => {
  assert.deepEqual(lessonResultCapabilities({ id: "insertion", scoring: { version: 1 } }), { score: true, stars: "time", official: true });
  assert.deepEqual(lessonResultCapabilities({ id: "quick", hasScoreThresholds: true }), { score: true, stars: "time", official: false });
  assert.deepEqual(lessonResultCapabilities({ id: "queue-dequeue" }), { score: true, stars: "time", official: false });
  assert.deepEqual(lessonResultCapabilities({ id: "bubble" }), { score: false, stars: "time", official: false });
  assert.deepEqual(lessonResultCapabilities({ id: "matrix-bfs", hasOfficialResult: true }), { score: false, stars: "time", official: true });
});
