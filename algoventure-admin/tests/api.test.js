import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api/client.js";

test("API writes use server CSRF tokens and cookies; logout rotates the client token", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith("/csrf"))
      return Response.json({
        token: `token-${calls.length}`,
        headerName: "X-XSRF-TOKEN",
      });
    if (path.endsWith("/logout")) return new Response(null, { status: 204 });
    return Response.json({ id: "saved" });
  };
  try {
    await api("/instructor/classes", {
      method: "POST",
      body: { name: "Class" },
    });
    assert.equal(calls[0].path, "/api/auth/csrf");
    assert.equal(calls[1].options.credentials, "include");
    assert.equal(calls[1].options.headers["X-XSRF-TOKEN"], "token-1");
    assert.equal(calls[1].options.body, '{"name":"Class"}');
    await api("/auth/logout", { method: "POST" });
    const form = new FormData();
    form.append("title", "Notes");
    await api("/instructor/classes/c/materials", {
      method: "POST",
      body: form,
    });
    assert.equal(calls[3].path, "/api/auth/csrf");
    assert.equal(calls[4].options.body, form);
    assert.equal(calls[4].options.headers["Content-Type"], undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API unauthorized responses revoke UI access and surface server validation messages", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = new EventTarget();
  let expired = false;
  window.addEventListener("auth-expired", () => {
    expired = true;
  });
  globalThis.fetch = async () =>
    Response.json({ message: "Please sign in" }, { status: 401 });
  try {
    await assert.rejects(
      api("/auth/me"),
      (error) => error.status === 401 && error.message === "Please sign in",
    );
    assert.equal(expired, true);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
