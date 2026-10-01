import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const apiOrigin = process.env.ORYX_DEV_API_ORIGIN;
if (apiOrigin) {
  const address = new URL(apiOrigin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(address.hostname);
  if (address.protocol !== "https:" && !local) {
    // Passwords and tokens would cross the network unencrypted. Allowed only as an explicit
    // development choice, for a backend that is not yet served over HTTPS.
    if (process.env.ORYX_DEV_ALLOW_INSECURE_API !== "1") {
      throw new Error("ORYX_DEV_API_ORIGIN must use HTTPS or a loopback address. Set ORYX_DEV_ALLOW_INSECURE_API=1 to use plain HTTP knowingly.");
    }
    console.warn(`[oryx] Proxying /api to ${apiOrigin} over plain HTTP: credentials are not encrypted in transit.`);
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    ...(apiOrigin ? { proxy: {
      "/api": {
        target: apiOrigin,
        changeOrigin: true,
      },
    } } : {}),
  },
  build: { outDir: "dist", sourcemap: false },
  test: { maxWorkers: 4, setupFiles: ["./src/test/setup.ts"] },
});
