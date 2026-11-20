import test from "node:test";
import assert from "node:assert/strict";
import { login, logout } from "../src/auth/authService.js";
import { getPlatformSettings, updatePlatformSettings } from "../src/features/admin/settings/platformSettingsService.js";

const origin = process.env.ALGOVENTURE_REDIS_TEST_PORTAL;
test("committed Portal settings invalidate the Game Redis view immediately", {
  skip: !origin,
  timeout: 30000,
}, async () => {
  const url = new URL(origin);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Use a loopback fixture");
  assert.equal(process.env.ALGOVENTURE_REDIS_DISPOSABLE, "true", "Explicit disposable DB acknowledgement required");
  const email = process.env.ALGOVENTURE_REDIS_TEST_ADMIN_EMAIL;
  const password = process.env.ALGOVENTURE_REDIS_TEST_ADMIN_PASSWORD;
  assert.ok(email && password, "Provide credentials for the disposable fixture only");

  const nativeFetch = globalThis.fetch;
  const cookies = new Map();
  globalThis.fetch = async (path, options = {}) => {
    const headers = new Headers(options.headers);
    if (cookies.size) headers.set("Cookie", [...cookies].map(([key, value]) => key + "=" + value).join("; "));
    const response = await nativeFetch(new URL(path, url), { ...options, headers });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const separator = pair.indexOf("=");
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return response;
  };
  let original;
  try {
    await login(email, password);
    original = await getPlatformSettings();
    const warmed = await fetch("/api/game/settings");
    assert.equal(warmed.status, 200);
    await warmed.json();
    const platformName = "Redis Portal QA " + Date.now();
    await updatePlatformSettings({ ...original, platformName });
    const fresh = await fetch("/api/game/settings");
    assert.equal(fresh.status, 200);
    assert.equal((await fresh.json()).platformName, platformName);
  } finally {
    try {
      if (original) await updatePlatformSettings(original);
      await logout();
    } finally {
      globalThis.fetch = nativeFetch;
    }
  }
});
