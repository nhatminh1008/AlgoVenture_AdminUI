import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export function loadBackendEnv(mode, workspace = new URL("../../", import.meta.url)) {
  const canonical = new URL("AlgoVenture_Backend/", workspace);
  const local = new URL("Backend/", workspace);
  const backendDir = [canonical, local].find((directory) => existsSync(new URL(".env", directory))) ?? canonical;
  return loadEnv(mode, fileURLToPath(backendDir), ["BACKEND_URL", "PORT"]);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { BACKEND_URL, PORT, PORTAL_HOST, PORTAL_PORT } = loadBackendEnv(mode);
  return {
    server: {
      host: PORTAL_HOST || "127.0.0.1",
      port: Number(PORTAL_PORT || 5174),
      strictPort: true,
      proxy: {
        "/api": { target: BACKEND_URL || `http://127.0.0.1:${PORT || 8081}`, changeOrigin: true },
      },
    },
    plugins: [react(), tailwindcss()],
  };
});
