import test from "node:test";
import assert from "node:assert/strict";
import {
  repo,
  memoryStorage,
  session,
  now,
  fixtureAssignment,
} from "./helpers.js";
import { STORAGE_KEY, LEGACY_KEY } from "../src/data/localRepository.js";
import { createSeed } from "../src/data/seed.js";

test("seed is deterministic and provides 3 classes, 8 enrollments, 6 published/3 draft and real attempts", async () => {
  assert.deepEqual(createSeed(now, session), createSeed(now, session));
  const storage = memoryStorage();
  const repository = repo(storage);
  const classes = await repository.listClassrooms();
  assert.deepEqual(
    classes.map((item) => item.inviteCode),
    ["DSA2026", "SORT101", "TREE2026"],
  );
  const data = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(data.enrollments.length, 8);
  assert.equal(
    data.assignments.filter((item) => item.status === "published").length,
    6,
  );
  assert.equal(
    data.assignments.filter((item) => item.status === "draft").length,
    3,
  );
  assert(data.attempts.length > 8);
  assert.deepEqual(await repository.listClassrooms(), classes);
});
test("ownership checks every scoped read/write and separates forbidden from missing", async () => {
  const storage = memoryStorage();
  const owner = repo(storage);
  await owner.listClassrooms();
  const other = repo(storage, { session: { ...session, userId: "other" } });
  assert.deepEqual(await other.listClassrooms(), []);
  const assignmentId = (await owner.listAssignments("sorting-basic"))[0].id;
  for (const operation of [
    () => other.getClassroom("sorting-basic"),
    () => other.updateClassroom("sorting-basic", { title: "No" }),
    () => other.deleteClassroom("sorting-basic"),
    () => other.listEnrollments("sorting-basic"),
    () => other.listAssignments("sorting-basic"),
    () => other.getAssignment(assignmentId),
    () => other.saveAssignment(fixtureAssignment(), assignmentId),
    () => other.deleteAssignment(assignmentId),
    () => other.listAttempts({ classroomId: "sorting-basic" }),
  ])
    await assert.rejects(operation, (error) => error.code === "FORBIDDEN");
  await assert.rejects(
    () => owner.getClassroom("missing"),
    (error) => error.code === "NOT_FOUND",
  );
  await assert.rejects(
    () => owner.getAssignment("missing"),
    (error) => error.code === "NOT_FOUND",
  );
  await assert.rejects(
    () =>
      repo(storage, {
        session: { ...session, role: "LEARNER" },
      }).createClassroom({ title: "No" }),
    (error) => error.code === "FORBIDDEN",
  );
});
test("class title uniqueness is per instructor, metadata is optional and does not lock", async () => {
  const storage = memoryStorage();
  const first = repo(storage);
  await first.listClassrooms();
  const classroom = await first.createClassroom({ title: "New class" });
  await assert.rejects(
    () => first.createClassroom({ title: " new CLASS " }),
    (error) => error.code === "VALIDATION",
  );
  const changed = await first.updateClassroom("sorting-basic", {
    title: "New topic",
    topicId: "graphs",
    level: "advanced",
  });
  assert.equal(changed.topicId, "graphs");
  const other = repo(storage, { session: { ...session, userId: "other" } });
  assert.equal(
    (await other.createClassroom({ title: "New class" })).title,
    classroom.title,
  );
});
test("published assignments without attempts can edit, unpublish and delete", async () => {
  const repository = repo();
  await repository.listClassrooms();
  let assignment = await repository.saveAssignment(fixtureAssignment());
  assignment = await repository.saveAssignment(
    {
      ...assignment,
      questions: assignment.questions.map((question) => ({
        ...question,
        prompt: question.prompt + " mới",
      })),
    },
    assignment.id,
  );
  assignment = await repository.saveAssignment(
    { ...assignment, status: "draft" },
    assignment.id,
  );
  assert.equal(assignment.status, "draft");
  await repository.deleteAssignment(assignment.id);
  await assert.rejects(
    () => repository.getAssignment(assignment.id),
    (error) => error.code === "NOT_FOUND",
  );
});
test("after attempts questions and deletion are locked, metadata remains editable", async () => {
  const repository = repo();
  const original = (await repository.listAssignments("sorting-basic"))[0];
  await assert.rejects(
    () =>
      repository.saveAssignment(
        {
          ...original,
          questions: original.questions.map((question, i) =>
            i ? question : { ...question, explanation: "Changed" },
          ),
        },
        original.id,
      ),
    (error) => error.code === "LOCKED",
  );
  await assert.rejects(
    () =>
      repository.saveAssignment({ ...original, status: "draft" }, original.id),
    (error) => error.code === "LOCKED",
  );
  await assert.rejects(
    () => repository.deleteAssignment(original.id),
    (error) => error.code === "LOCKED",
  );
  const changed = await repository.saveAssignment(
    {
      ...original,
      title: "Đã đổi tên",
      description: "Hướng dẫn mới",
      dueAt: "2026-12-01T16:59:00.000Z",
    },
    original.id,
  );
  assert.equal(changed.title, "Đã đổi tên");
  assert.deepEqual(changed.questions, original.questions);
});
test("read-modify-write sees other repository instance mutations; no captured snapshots", async () => {
  const storage = memoryStorage();
  const one = repo(storage);
  const two = repo(storage, { id: () => "two-new" });
  await one.listClassrooms();
  await two.listClassrooms();
  await one.createClassroom({ title: "One" });
  await two.createClassroom({ title: "Two" });
  assert.equal((await one.listClassrooms()).length, 5);
});
test("cascade deletion removes only target memberships, assignments and attempts", async () => {
  const storage = memoryStorage();
  const repository = repo(storage);
  await repository.listClassrooms();
  const before = JSON.parse(storage.getItem(STORAGE_KEY));
  const removed = new Set(
    before.assignments
      .filter((item) => item.classroomId === "sorting-basic")
      .map((item) => item.id),
  );
  await repository.deleteClassroom("sorting-basic");
  const after = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(after.classrooms.length, 2);
  assert(
    after.enrollments.every((item) => item.classroomId !== "sorting-basic"),
  );
  assert(after.assignments.every((item) => !removed.has(item.id)));
  assert(after.attempts.every((item) => !removed.has(item.assignmentId)));
  assert.equal(after.enrollments.length, 5);
});
test("one-time v1 migration preserves source, translates IDs/deadline, flags five-option questions without truncation", async () => {
  const question = {
    id: "q",
    prompt: "Legacy?",
    options: ["A", "B", "C", "D", "E"].map((text, i) => ({
      id: `c${i}`,
      text,
    })),
    correctOptionId: "c1",
    explanation: "Legacy explanation",
  };
  const legacy = JSON.stringify({
    classes: [
      {
        id: "c",
        name: "Legacy class",
        instructorId: session.userId,
        description: "",
      },
    ],
    students: [{ id: "s", classId: "c", name: "An", email: "an@example.com" }],
    assignments: [{ id: "old-game", classId: "c" }],
    quizzes: [
      {
        id: "quiz",
        classId: "c",
        title: "Legacy quiz",
        description: "",
        status: "Published",
        due: "2026-11-01",
        questions: [question],
      },
    ],
  });
  const storage = memoryStorage({ [LEGACY_KEY]: legacy });
  const repository = repo(storage);
  const classroom = (await repository.listClassrooms())[0];
  assert.equal(classroom.title, "Legacy class");
  assert.equal(classroom.instructorName, session.name);
  const assignments = await repository.listAssignments("c");
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0].status, "draft");
  assert.equal(assignments[0].questions[0].options.length, 5);
  assert.equal(assignments[0].questions[0].migrationInvalid, true);
  assert.equal(assignments[0].questions[0].correctIndex, 1);
  assert.equal(assignments[0].dueAt, "2026-11-01T16:59:00.000Z");
  assert.equal(storage.getItem(LEGACY_KEY), legacy);
  assert.equal(
    (await repository.listEnrollments("c"))[0].joinedAt,
    now().toISOString(),
  );
  const v2 = storage.getItem(STORAGE_KEY);
  storage.setItem(LEGACY_KEY, "{}");
  await repository.listClassrooms();
  assert.equal(storage.getItem(STORAGE_KEY), v2);
});
test("valid four-option published legacy quizzes stay published even when deadline has passed", async () => {
  const a = fixtureAssignment();
  const question = a.questions[0];
  const storage = memoryStorage({
    [LEGACY_KEY]: JSON.stringify({
      classes: [
        { id: "sorting-basic", name: "Old", instructorId: session.userId },
      ],
      students: [],
      quizzes: [
        {
          id: "old",
          classId: "sorting-basic",
          title: "Old valid",
          due: "2026-10-01",
          status: "Published",
          questions: [
            {
              ...question,
              options: question.options.map((text, i) => ({
                id: `o${i}`,
                text,
              })),
              correctOptionId: "o0",
            },
          ],
        },
      ],
    }),
  });
  const assignment = (await repo(storage).listAssignments("sorting-basic"))[0];
  assert.equal(assignment.status, "published");
  assert.equal(assignment.questions[0].correctIndex, 0);
});
test("per-record corruption drops only invalid records without reseeding", async () => {
  const seeded = createSeed(now, session);
  seeded.enrollments.push({ id: "bad" });
  seeded.assignments.push({ id: "bad" });
  seeded.classrooms.push({ id: "bad" });
  seeded.attempts.push({ id: "bad" });
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(seeded) });
  const repository = repo(storage);
  assert.equal((await repository.listClassrooms()).length, 3);
  assert.equal((await repository.listEnrollments("sorting-basic")).length, 3);
  assert.equal((await repository.listAssignments("sorting-basic")).length, 3);
  assert(repository.getNotices().some((item) => item.includes("4 bản ghi")));
});
test("unreadable v2 is backed up before replacement; quota failure preserves original", async () => {
  const storage = memoryStorage({ [STORAGE_KEY]: "{not-json" });
  await repo(storage).listClassrooms();
  assert.equal(
    storage.getItem(`${STORAGE_KEY}.corrupt-${now().getTime()}`),
    "{not-json",
  );
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).version, 2);
  const failed = memoryStorage({ [STORAGE_KEY]: "{broken" });
  failed.setItem = () => {
    throw new Error("Quota");
  };
  await assert.rejects(
    () => repo(failed).listClassrooms(),
    (error) => error.code === "STORAGE",
  );
  assert.equal(failed.getItem(STORAGE_KEY), "{broken");
});
test("storage write errors propagate and do not report a successful class save", async () => {
  const storage = memoryStorage();
  const repository = repo(storage);
  await repository.listClassrooms();
  const original = storage.getItem(STORAGE_KEY);
  storage.setItem = () => {
    throw new Error("No space");
  };
  await assert.rejects(
    () => repository.createClassroom({ title: "Not saved" }),
    (error) => error.code === "STORAGE",
  );
  assert.equal(storage.getItem(STORAGE_KEY), original);
});

test("equivalent question property ordering does not block metadata edits and deadlines store UTC", async () => {
  const repository = repo();
  const original = (await repository.listAssignments("sorting-basic"))[0];
  const questions = original.questions.map((q) => ({
    explanation: q.explanation,
    correctIndex: q.correctIndex,
    options: q.options,
    prompt: q.prompt,
    id: q.id,
  }));
  const changed = await repository.saveAssignment(
    { ...original, questions, title: "Metadata only" },
    original.id,
  );
  assert.equal(changed.title, "Metadata only");
  const fresh = await repository.saveAssignment({
    ...fixtureAssignment(),
    dueAt: "2026-11-02T23:59:00+07:00",
  });
  assert.equal(fresh.dueAt, "2026-11-02T16:59:00.000Z");
});

test("partially broken legacy records do not replace valid classes with demo data", async () => {
  const storage = memoryStorage({
    [LEGACY_KEY]: JSON.stringify({
      classes: [
        { id: "legacy-only", name: "Keep me", instructorId: session.userId },
        null,
      ],
      students: [null],
      quizzes: [
        {
          id: "incomplete",
          classId: "legacy-only",
          title: "Incomplete",
          questions: [null],
        },
      ],
    }),
  });
  const repository = repo(storage);
  assert.deepEqual(
    (await repository.listClassrooms()).map((item) => item.id),
    ["legacy-only"],
  );
  const draft = (await repository.listAssignments("legacy-only"))[0];
  assert.equal(draft.status, "draft");
  assert.equal(draft.questions[0].migrationInvalid, true);
});
