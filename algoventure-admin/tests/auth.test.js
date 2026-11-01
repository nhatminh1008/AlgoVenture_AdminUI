import test from "node:test";
import assert from "node:assert/strict";
import { loginDestination } from "../src/auth/routing.js";

test("return URLs stay within the authenticated role and retain query filters", () => {
  assert.equal(
    loginDestination("instructor", {
      pathname: "/instructor/analytics",
      search: "?classId=sorting-basic",
    }),
    "/instructor/analytics?classId=sorting-basic",
  );
  assert.equal(
    loginDestination("admin", { pathname: "/instructor/classes" }),
    "/admin",
  );
  assert.equal(
    loginDestination("instructor", { pathname: "/admin/users" }),
    "/instructor/classes",
  );
  for (const pathname of [
    "//example.com",
    "/administrator",
    "/admin-evil",
    "https://example.com",
  ]) {
    assert.equal(loginDestination("admin", { pathname }), "/admin");
  }
});
