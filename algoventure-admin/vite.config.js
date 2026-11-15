import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendDir = fileURLToPath(new URL("../../AlgoVenture_Backend/", import.meta.url));
  const { BACKEND_URL, PORT, PORTAL_HOST, PORTAL_PORT } = loadEnv(mode, backendDir, [
    "BACKEND_URL", "PORT",
  ]);
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
