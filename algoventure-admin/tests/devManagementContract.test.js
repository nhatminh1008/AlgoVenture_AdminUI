import assert from "node:assert/strict";
import { test } from "node:test";
import { createUser, lockUser } from "../src/features/admin/users/userService.js";
import { listClassroomMembers, setClassroomLocked } from "../src/features/admin/classrooms/adminClassroomService.js";
import { closeQuiz } from "../src/features/instructor/workspace/instructorWorkspaceService.js";

test("administration and quiz writes use the Backend dev routes and CSRF", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (path, options) => {
    if (path === "/api/auth/csrf") {
      return Response.json({ headerName: "X-XSRF-TOKEN", token: "fixture" });
    }
    const { method, body, headers, credentials } = options;
    calls.push({ path, method, body: body && JSON.parse(body), csrf: headers["X-XSRF-TOKEN"], credentials });
    if (method === "GET") return Response.json([]);
    if (path.includes("/classes/")) return Response.json({ id: "class/1" });
    if (path === "/api/admin/users") return Response.json({ id: "new-user" }, { status: 201 });
    return new Response(null, { status: 204 });
  });

  const account = {
    email: " staff@example.test ", name: " Staff ", password: "fixture-password",
    role: "instructor", status: "Active", phone: " 123 ",
  };
  await createUser(account);
  await lockUser("user/1");
  await setClassroomLocked("class/1", true);
  await setClassroomLocked("class/1", false);
  await listClassroomMembers("class/1");
  await closeQuiz("quiz/1");

  assert.deepEqual(calls.map(({ path, method, body }) => [method, path, body]), [
    ["POST", "/api/admin/users", {
      email: "staff@example.test", name: "Staff", password: "fixture-password",
      role: "instructor", status: "Active", profile: { dateOfBirth: null, phone: "123", address: null },
    }],
    ["PUT", "/api/admin/users/user%2F1/lock", undefined],
    ["PUT", "/api/admin/classes/class%2F1/lock", { locked: true }],
    ["PUT", "/api/admin/classes/class%2F1/lock", { locked: false }],
    ["GET", "/api/admin/classes/class%2F1/members", undefined],
    ["POST", "/api/instructor/assignments/quiz%2F1/close", undefined],
  ]);
  assert.ok(calls.every((call) => call.credentials === "include"));
  assert.ok(calls.filter((call) => call.method !== "GET").every((call) => call.csrf === "fixture"));
});
