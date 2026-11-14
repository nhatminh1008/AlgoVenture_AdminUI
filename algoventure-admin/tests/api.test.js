import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api/apiClient.js";

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

test("a revoked Deactive session forwards the account notice", async () => {
  const { api: request } = await import("../src/api/apiClient.js?test=deactive-notice");
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const message = "Tài khoản của bạn đã bị vô hiệu hóa, vui lòng liên hệ Instructor.";
  globalThis.window = new EventTarget();
  let notice;
  window.addEventListener("auth-expired", (event) => { notice = event.detail; });
  const revoked = Promise.withResolvers();
  globalThis.fetch = async (path) => path === "/api/auth/me" ? revoked.promise : new Response(null, { status: 401 });
  try {
    const polling = request("/auth/me");
    await assert.rejects(request("/admin/users"), { status: 401 });
    assert.equal(notice, "");
    revoked.resolve(Response.json({ message, code: "ACCOUNT_DEACTIVATED" }, { status: 401 }));
    await assert.rejects(polling, { message, status: 401 });
    assert.equal(notice, message);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});

test("concurrent writes share a CSRF request and a forbidden write refreshes it on the next attempt", async () => {
  const { api: request } = await import("../src/api/apiClient.js?test=csrf-concurrency");
  const originalFetch = globalThis.fetch;
  let tokenFetches = 0;
  const sent = [];
  globalThis.fetch = async (path, options) => {
    if (path === "/api/auth/csrf") {
      tokenFetches++;
      return Response.json({ headerName: "X-XSRF-TOKEN", token: `token-${tokenFetches}` });
    }
    sent.push([path, options.headers["X-XSRF-TOKEN"]]);
    return path.endsWith("/forbidden")
      ? Response.json({ message: "Forbidden" }, { status: 403 })
      : new Response(null, { status: 204 });
  };
  try {
    const first = request("/first", { method: "POST" });
    const second = request("/second", { method: "DELETE" });
    assert.deepEqual(await Promise.all([first, second]), [null, null]);
    assert.equal(tokenFetches, 1);
    assert.deepEqual(sent, [["/api/first", "token-1"], ["/api/second", "token-1"]]);
    await assert.rejects(request("/forbidden", { method: "POST" }), { status: 403 });
    assert.equal(sent.length, 3);
    await request("/retry", { method: "POST" });
    assert.equal(tokenFetches, 2);
    assert.deepEqual(sent.at(-1), ["/api/retry", "token-2"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a delayed unauthorized response from the old session does not expire a new login", async () => {
  const { api: request } = await import("../src/api/apiClient.js?test=session-version");
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const oldResponse = Promise.withResolvers();
  const events = new EventTarget();
  let expirations = 0;
  events.addEventListener("auth-expired", () => expirations++);
  globalThis.window = events;
  globalThis.fetch = async (path) => {
    if (path === "/api/auth/csrf") {
      return Response.json({ headerName: "X-XSRF-TOKEN", token: "fixture-token" });
    }
    if (path === "/api/auth/login") return Response.json({ id: "new-session" });
    if (path === "/api/old-request") return oldResponse.promise;
    return Response.json({ message: "Please sign in" }, { status: 401 });
  };
  try {
    const stale = request("/old-request");
    await request("/auth/login", { method: "POST" });
    oldResponse.resolve(Response.json({ message: "Previous session", code: "ACCOUNT_DEACTIVATED" }, { status: 401 }));
    await assert.rejects(stale, { message: "Previous session", status: 401 });
    assert.equal(expirations, 0);
    await assert.rejects(request("/auth/me"), { status: 401 });
    assert.equal(expirations, 1);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
