import test from "node:test";
import assert from "node:assert/strict";
import { fixtureAssignment, now } from "./helpers.js";
import {
  gradeAttempt,
  deriveStatus,
  bestAttempt,
  canSubmit,
  completionRate,
  scoreDistribution,
  questionErrorStats,
  scoreTrend,
  gradebookRows,
} from "../src/data/metrics.js";
import {
  validateAssignment,
  validateQuestion,
  generateInviteCode,
  normalizeInviteCode,
  createQuestion,
} from "../src/data/validators.js";
import {
  fromDueInput,
  toDueInput,
  formatDate,
  isISO,
} from "../src/data/dates.js";
import {
  buildGradebookTable,
  buildQuestionErrorTable,
  buildWorkbookRows,
  tableToCSV,
  csvCell,
} from "../src/data/exports.js";
import {
  toLearnerClassroom,
  toLearnerAssignment,
  toLearnerAttempt,
} from "../src/data/repository.js";

test("grading matches game: unanswered/null/invalid is wrong and percentages round", () => {
  const assignment = fixtureAssignment();
  const result = gradeAttempt(assignment, [
    { questionId: "q0", selectedIndex: 0 },
    { questionId: "q1", selectedIndex: 1 },
    { questionId: "q2", selectedIndex: null },
  ]);
  assert.deepEqual(result, {
    answers: [
      { questionId: "q0", selectedIndex: 0 },
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: null },
    ],
    correctCount: 2,
    total: 3,
    scorePercent: 67,
  });
  assert.equal(gradeAttempt(assignment, []).scorePercent, 0);
  assert.equal(
    gradeAttempt(assignment, [{ questionId: "q0", selectedIndex: 9 }])
      .answers[0].selectedIndex,
    null,
  );
});
test("deadline boundary is inclusive, overdue only strictly after and submitted takes precedence", () => {
  const assignment = fixtureAssignment({ dueAt: now().toISOString() });
  assert.equal(deriveStatus(assignment, [], now), "not_started");
  assert.equal(canSubmit(assignment, now), true);
  const later = () => new Date(now().getTime() + 1);
  assert.equal(deriveStatus(assignment, [], later), "overdue");
  assert.equal(canSubmit(assignment, later), false);
  assert.equal(deriveStatus(assignment, [{}], later), "submitted");
  assert.equal(canSubmit({ ...assignment, status: "draft" }, now), false);
});
test("best attempt chooses maximum score then latest submission without mutating input", () => {
  const attempts = [
    { id: "1", scorePercent: 80, submittedAt: "2026-10-30T00:00:00Z" },
    { id: "2", scorePercent: 20, submittedAt: "2026-10-31T00:00:00Z" },
    { id: "3", scorePercent: 80, submittedAt: "2026-10-31T01:00:00Z" },
  ];
  assert.equal(bestAttempt(attempts).id, "3");
  assert.equal(attempts[0].id, "1");
  assert.equal(bestAttempt([]), null);
});
test("completion counts enrolled learners once and handles no learners", () => {
  assert.equal(completionRate([], []), 0);
  assert.equal(
    completionRate(
      [{ learnerId: "a" }, { learnerId: "b" }],
      [{ learnerId: "a" }, { learnerId: "a" }, { learnerId: "foreign" }],
    ),
    50,
  );
});
test("distribution has five precise buckets and puts 100 into the last", () => {
  assert.deepEqual(
    scoreDistribution(
      [0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map((scorePercent) => ({
        scorePercent,
      })),
    ).map((item) => item.count),
    [2, 2, 2, 2, 2],
  );
});
test("most-missed uses only each submitted learner best attempt and includes blank answers", () => {
  const assignment = fixtureAssignment();
  const history = [
    {
      id: "old",
      assignmentId: assignment.id,
      learnerId: "a",
      submittedAt: now().toISOString(),
      ...gradeAttempt(assignment, []),
    },
    {
      id: "best",
      assignmentId: assignment.id,
      learnerId: "a",
      submittedAt: now().toISOString(),
      ...gradeAttempt(assignment, [{ questionId: "q1", selectedIndex: 1 }]),
    },
  ];
  const rows = questionErrorStats(assignment, history, [
    { learnerId: "a" },
    { learnerId: "not-submitted" },
  ]);
  assert.equal(rows[0].missedPercent, 100);
  assert.equal(rows[0].submittedLearners, 1);
  assert.equal(rows[1].missedCount, 0);
});
test("trend groups all submissions by Vietnam date, not UTC date", () => {
  const rows = scoreTrend([
    { submittedAt: "2026-10-30T18:00:00Z", scorePercent: 20 },
    { submittedAt: "2026-10-31T03:00:00Z", scorePercent: 80 },
  ]);
  assert.deepEqual(rows, [
    { day: "2026-10-31", label: "31/10/2026", average: 50, attempts: 2 },
  ]);
});
test("question validator requires four distinct nonempty options, valid answer and explanation", () => {
  const question = fixtureAssignment().questions[0];
  assert.equal(validateQuestion(question), "");
  for (const values of [
    { options: ["1", "2", "3"] },
    { options: ["1", " 1 ", "3", "4"] },
    { options: ["1", "", "3", "4"] },
    { correctIndex: 4 },
    { correctIndex: -1 },
    { explanation: "  " },
    { prompt: "x".repeat(2001) },
    { explanation: "x".repeat(2001) },
    { options: ["x".repeat(501), "2", "3", "4"] },
  ])
    assert.notEqual(validateQuestion({ ...question, ...values }), "");
});
test("publish requires a future full deadline and 1–50 complete questions, drafts allow unfinished content", () => {
  const assignment = fixtureAssignment();
  assert.equal(validateAssignment(assignment, { now, publishing: true }), "");
  for (const values of [
    { dueAt: "" },
    { dueAt: now().toISOString() },
    { dueAt: "2026-02-31T16:59:00Z" },
    { questions: [] },
    {
      questions: Array.from({ length: 51 }, (_, i) => ({
        ...assignment.questions[0],
        id: `q${i}`,
      })),
    },
  ])
    assert.notEqual(
      validateAssignment(
        { ...assignment, ...values },
        { now, publishing: true },
      ),
      "",
    );
  assert.equal(
    validateAssignment({
      ...assignment,
      status: "draft",
      dueAt: "",
      questions: [createQuestion(() => "draft")],
    }),
    "",
  );
  assert.notEqual(
    validateAssignment({ ...assignment, title: " ", status: "draft" }),
    "",
  );
});
test("Vietnam due-date round trip and formatting are independent from host timezone", () => {
  const input = "2026-10-31T23:59";
  assert.equal(fromDueInput(input), "2026-10-31T16:59:00.000Z");
  assert.equal(toDueInput(fromDueInput(input)), input);
  assert.match(formatDate(fromDueInput(input)), /23:59/);
  assert.throws(() => fromDueInput("2026-02-31T23:59"));
  assert.equal(isISO("2026-02-31T00:00:00Z"), false);
});
test("invite codes normalize, exclude ambiguous characters and avoid collisions", () => {
  assert.equal(normalizeInviteCode("  dsa2026 "), "DSA2026");
  let step = 0;
  const code = generateInviteCode(["AAAAAAAA"], () => (++step <= 8 ? 0 : 0.5));
  assert.equal(code.length, 8);
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.notEqual(code, "AAAAAAAA");
  assert.throws(() => generateInviteCode(["AAAAAAAA"], () => 0));
});
test("gradebook builds actual latest and best values and omits drafts", () => {
  const assignment = fixtureAssignment();
  const enrollment = {
    classroomId: "sorting-basic",
    learnerId: "s1",
    learnerName: "An",
    learnerEmail: "a@example.com",
  };
  const history = [
    {
      id: "1",
      assignmentId: assignment.id,
      learnerId: "s1",
      submittedAt: "2026-10-30T00:00:00Z",
      ...gradeAttempt(assignment, [{ questionId: "q0", selectedIndex: 0 }]),
    },
    {
      id: "2",
      assignmentId: assignment.id,
      learnerId: "s1",
      submittedAt: "2026-10-31T00:00:00Z",
      ...gradeAttempt(assignment, []),
    },
  ];
  const rows = gradebookRows(
    [{ id: "sorting-basic", title: "DSA" }],
    [enrollment],
    [assignment, { ...assignment, id: "draft", status: "draft" }],
    history,
    now,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].bestScorePercent, 33);
  assert.equal(rows[0].attemptCount, 2);
  assert.equal(rows[0].lastSubmittedAt, history[1].submittedAt);
  const table = buildGradebookTable(rows);
  assert.equal(table[1][0], "DSA");
  assert.equal(table[1][5], 33);
  assert.equal(table[1][6], "1/3");
  assert.equal(
    buildQuestionErrorTable(
      questionErrorStats(assignment, history, [enrollment]),
    )[1][2],
    0,
  );
  assert.deepEqual(buildWorkbookRows(rows, []).gradebook, table);
});
test("CSV retains BOM, Unicode, quote escaping and formula guard", () => {
  assert.equal(csvCell('Nguyễn, "An"'), '"Nguyễn, ""An"""');
  for (const text of ["=SUM(A1)", "+1", "-1", "@test", "\t=1", "\r=1"])
    assert(csvCell(text).startsWith("\"'"));
  assert.equal(
    tableToCSV([["Tên"], ["Nguyễn, An"]]),
    '\uFEFF"Tên"\r\n"Nguyễn, An"',
  );
});
test("game projections have exact public field names and hide draft assignments", () => {
  const assignment = fixtureAssignment();
  assert.deepEqual(Object.keys(toLearnerAssignment(assignment)).sort(), [
    "classroomId",
    "description",
    "dueAt",
    "id",
    "questions",
    "title",
  ]);
  assert.equal(toLearnerAssignment({ ...assignment, status: "draft" }), null);
  assert.deepEqual(
    toLearnerClassroom(
      { id: "1", title: "DSA", instructorName: "GV", createdAt: "wrong" },
      { joinedAt: "real" },
    ),
    { id: "1", title: "DSA", instructorName: "GV", joinedAt: "real" },
  );
  assert(
    !("learnerId" in toLearnerAttempt({ id: "attempt", learnerId: "s1" })),
  );
});
