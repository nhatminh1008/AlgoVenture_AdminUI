import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/data/curriculum.js";
import {
  validateClass,
  validateAssignment,
  initialData,
  loadClassrooms,
  csvCell,
  exportStudentRows,
} from "../src/data/classroom.js";

const classroom = initialData.classes[0];
test("curriculum exposes 25 unique learner-game lesson IDs", () => {
  const ids = topics.flatMap((topic) => topic.lessons.map(([id]) => id));
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
  assert(!ids.includes("array"));
});
test("class requires a name, registered topic and supported level", () => {
  assert.equal(validateClass(classroom, [], undefined), "");
  for (const overrides of [
    { name: "  " },
    { name: "a".repeat(101) },
    { topicId: "other" },
    { level: "hard" },
    { description: null },
  ]) {
    assert.notEqual(validateClass({ ...classroom, ...overrides }, []), "");
  }
});
test("duplicate names are rejected across case and whitespace but editing the same class is allowed", () => {
  assert.notEqual(
    validateClass({ ...classroom, name: ` ${classroom.name.toLowerCase()} ` }, [
      classroom,
    ]),
    "",
  );
  assert.equal(validateClass(classroom, [classroom], classroom.id), "");
});
test("assignment must target an existing class with nonempty lessons from its topic", () => {
  const assignment = initialData.assignments[0];
  assert.equal(validateAssignment(assignment, classroom), "");
  assert.notEqual(validateAssignment(assignment, undefined), "");
  for (const lessonIds of [[], ["binary"], ["bubble", "bubble"], "bubble"])
    assert.notEqual(
      validateAssignment({ ...assignment, lessonIds }, classroom),
      "",
    );
  assert.notEqual(
    validateAssignment({ ...assignment, due: "" }, classroom),
    "",
  );
  assert.equal(
    validateAssignment({ ...assignment, due: "", status: "Draft" }, classroom),
    "",
  );
});
test("storage round-trip preserves newly created empty classes", () => {
  const data = structuredClone(initialData);
  data.classes.push({ ...classroom, id: "new-class", name: "New Basic Class" });
  const result = loadClassrooms({ getItem: () => JSON.stringify(data) });
  assert.equal(result.error, "");
  assert.equal(result.data.classes.length, 4);
  assert.equal(
    result.data.students.filter((item) => item.classId === "new-class").length,
    0,
  );
});
test("corrupt or unavailable storage surfaces an error without attempting a write", () => {
  for (const raw of [
    "{",
    "{}",
    JSON.stringify({
      ...initialData,
      assignments: [{ ...initialData.assignments[0], lessonIds: ["binary"] }],
    }),
  ]) {
    const result = loadClassrooms({ getItem: () => raw });
    assert.notEqual(result.error, "");
    assert.deepEqual(result.data, initialData);
  }
  assert.notEqual(
    loadClassrooms({
      getItem: () => {
        throw new Error("Blocked");
      },
    }).error,
    "",
  );
});
test("CSV preserves commas, quotes and Unicode and neutralizes formula cells", () => {
  assert.equal(csvCell('Nguyễn, "An"'), '"Nguyễn, ""An"""');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  const csv = exportStudentRows(
    [{ ...initialData.students[0], name: 'Nguyễn, "An"', sampleScore: null }],
    initialData.classes,
  );
  assert(csv.startsWith("\uFEFF"));
  assert(csv.includes('"Nguyễn, ""An"""'));
  assert(!csv.includes("undefined"));
});
