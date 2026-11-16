import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { loadBackendEnv } from "../vite.config.js";

test("uses shared Backend config in local and conventional repo layouts", (t) => {
  const root = mkdtempSync(join(tmpdir(), "av-portal-env-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const workspace = pathToFileURL(root + sep);
  const environmentKeys = ["BACKEND_URL", "PORTAL_PORT"];
  const original = environmentKeys.map((key) => [key, process.env[key]]);
  t.after(() => {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  for (const key of environmentKeys) delete process.env[key];

  const local = join(root, "Backend");
  mkdirSync(local);
  writeFileSync(join(local, ".env"), "BACKEND_URL=https://backend.example.test\nPORTAL_PORT=5190\nDB_PASSWORD=fixture-only\n");
  const settings = loadBackendEnv("test", workspace);
  assert.equal(settings.BACKEND_URL, "https://backend.example.test");
  assert.equal(settings.PORTAL_PORT, "5190");
  assert.equal(settings.DB_PASSWORD, undefined);

  const canonical = join(root, "AlgoVenture_Backend");
  mkdirSync(canonical);
  writeFileSync(join(canonical, ".env"), "PORTAL_PORT=5174\n");
  assert.equal(loadBackendEnv("test", workspace).PORTAL_PORT, "5174");
});
