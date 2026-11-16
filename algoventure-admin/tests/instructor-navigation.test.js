import assert from "node:assert/strict";
import { test } from "node:test";
import {
  instructorActivePath, instructorBack, instructorChildState, instructorDestination, instructorParent, progressResultsPath,
} from "../src/features/instructor/workspace/useInstructorNavigation.js";

const classroom = "/instructor/classes/class-1";
const student = `${classroom}/students/student-1`;
const assignment = `${student}/assignments/assignment-1`;
const quiz = `${student}/quizzes/quiz-1`;
const progress = "/instructor/progress";
const classes = "/instructor/classes";

test("class and quiz management links open results in learning progress with a scoped route fallback", () => {
  const assignmentResults = progressResultsPath("class-1", "assignments", "delivery-1");
  const quizResults = progressResultsPath("class-1", "quizzes", "quiz-1");
  assert.equal(instructorDestination(assignmentResults, classes), assignmentResults);
  assert.equal(instructorDestination(quizResults, "/instructor/quizzes"), quizResults);
  assert.equal(assignmentResults, `${progress}?classId=class-1&tab=assignments&workId=delivery-1`);
  assert.equal(quizResults, `${progress}?classId=class-1&tab=quizzes&workId=quiz-1`);
  const quizSearch = new URL(quizResults, "http://test.local").search;
  assert.equal(instructorActivePath(progress, quizSearch + "&from=quizzes"), progress);
  assert.equal(instructorParent(`${progress}/classes/class-1/assignments/delivery-1`), `${progress}?tab=assignments&classId=class-1`);
  assert.equal(progressResultsPath("class-1", "quizzes", "quiz-1", "?resultsPage=2&q=student%40"),
    `${quizResults}&studentPage=2&q=student%40`);

  const roster = { pathname: classroom, search: "?tab=quizzes&quizPage=1", hash: "", key: "list" };
  const report = { pathname: progress, search: quizSearch, state: instructorChildState(roster, 2) };
  assert.deepEqual(instructorBack(report, 3), { to: classroom + roster.search, delta: -1, key: "list" });
});

test("a student detail link can restore the board filters without browser state", () => {
  const query = "tab=quizzes&workId=quiz-1&q=hoa%40&studentPage=1";
  const to = `${student}?${new URLSearchParams({ progressSearch: query, tab: "quizzes", quizId: "quiz-1" })}`;
  const url = new URL(instructorDestination(to, classes), "http://test.local");
  assert.equal(instructorActivePath(url.pathname, url.search), progress);
  assert.equal(instructorParent(url.pathname, url.search), `${progress}?${query}`);
});

test("detail links preserve the section in the URL and derive it without browser state", () => {
  assert.equal(instructorDestination(`${student}?filter=overdue`, progress), `${student}?filter=overdue&from=progress`);
  assert.equal(instructorDestination(assignment, classes), assignment);
  assert.equal(instructorActivePath(assignment, "?from=progress"), progress);
  assert.equal(instructorActivePath(assignment, "?from=invalid"), classes);
  assert.equal(instructorActivePath("/instructor/missing"), null);
});

test("direct links use route parents, including the student's quiz tab", () => {
  assert.equal(instructorParent(assignment), `${student}?tab=assignments`);
  assert.equal(instructorParent(assignment, "?from=progress"), `${student}?tab=assignments&from=progress`);
  assert.equal(instructorParent(quiz, "?from=progress"), `${student}?tab=quizzes&from=progress`);
  assert.equal(instructorParent(quiz, "?attemptPage=2&attemptId=123&answers=review"), `${quiz}?attemptPage=2`);
  assert.equal(instructorParent(student, "?from=progress"), `${progress}?classId=class-1`);
  assert.equal(instructorParent(student), `${classroom}?tab=students`);
  assert.equal(instructorParent(progress, "?classId=class-1"), null);
  assert.equal(instructorParent(progress, "?classId=class-1&from=classes"), `${classroom}?tab=students`);
});

test("Back uses the immediately preceding entry and retains its URL after same-screen changes", () => {
  const list = { pathname: progress, search: "?classId=class-1&q=student&studentPage=1", key: "list", hash: "" };
  const details = { pathname: student, search: "?tab=quizzes&from=progress", state: instructorChildState(list, 5) };
  assert.deepEqual(instructorBack(details, 6), { to: progress + list.search, delta: -1, key: "list" });
  assert.deepEqual(instructorBack(details, 0), { to: `${progress}?classId=class-1` });
  assert.deepEqual(instructorBack({ ...details, state: null }, 6), { to: `${progress}?classId=class-1` });
});

test("successful delivery can close both wizard steps and direct entry uses the class tab", () => {
  const list = { pathname: classroom, search: "?tab=assignments&setsPage=2", key: "list", hash: "" };
  const select = { pathname: `${classroom}/assign`, search: "?q=sort", key: "select", hash: "", state: instructorChildState(list, 5) };
  const recipients = { pathname: select.pathname, search: "?q=sort&template=1", state: instructorChildState(select, 6) };
  assert.deepEqual(instructorBack(recipients, 7), { to: select.pathname + select.search, delta: -1, key: "select" });
  assert.deepEqual(instructorBack(recipients, 7, 2), { to: classroom + list.search, delta: -2, key: "list" });
  const directSelection = { ...select, state: null };
  const directRecipients = { ...recipients, state: instructorChildState(directSelection, 6) };
  assert.deepEqual(instructorBack(directRecipients, 7, 2), { to: `${classroom}?tab=assignments`, replaceAfter: -1 });
  assert.deepEqual(instructorBack({ ...recipients, state: null }, 0, 2), { to: `${classroom}?tab=assignments` });
});
