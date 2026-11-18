import test from "node:test";
import assert from "node:assert/strict";
import { deactivateUser } from "../src/features/admin/users/userService.js";

test("deactivation uses the dedicated endpoint with cookie authentication and CSRF", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (path, options) => {
    if (path === "/api/auth/csrf") {
      return Response.json({ headerName: "X-XSRF-TOKEN", token: "deactivation-fixture" });
    }
    calls.push({ path, ...options });
    return new Response(null, { status: 204 });
  });

  await deactivateUser("user/1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/admin/users/user%2F1/deactivate");
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].credentials, "include");
  assert.equal(calls[0].headers["X-XSRF-TOKEN"], "deactivation-fixture");
  assert.equal(calls[0].body, undefined);
});

for (const status of [403, 404, 405, 500]) {
  test(`a rejected deactivation (${status}) never falls back to locking or editing the account`, async (t) => {
    const calls = [];
    t.mock.method(globalThis, "fetch", async (path, options) => {
      if (path === "/api/auth/csrf") {
        return Response.json({ headerName: "X-XSRF-TOKEN", token: "deactivation-fixture" });
      }
      calls.push([options.method, path]);
      return Response.json({ message: "Deactivation rejected" }, { status });
    });
    await assert.rejects(deactivateUser("user-1"), { status, message: "Deactivation rejected" });
    assert.deepEqual(calls, [["PUT", "/api/admin/users/user-1/deactivate"]]);
  });
}
