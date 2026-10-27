import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// Dev server settings come from apps/web/.env (see .env.example) or the shell environment.
const env = { ...loadEnv(process.env.NODE_ENV ?? "development", fileURLToPath(new URL(".", import.meta.url)), "ORYX_"), ...process.env };
const apiOrigin = env.ORYX_DEV_API_ORIGIN || undefined;
// The notification gateway (apps/gateway) during development. Without it the app falls back to checking for notifications on a timer.
const gatewayOrigin = env.ORYX_DEV_GATEWAY_ORIGIN || undefined;
const cacheGeneration = 2;
if (apiOrigin) {
  const address = new URL(apiOrigin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(address.hostname);
  if (address.protocol !== "https:" && !local) {
    // Passwords and tokens would cross the network unencrypted. Allowed only as an explicit
    // development choice, for a backend that is not yet served over HTTPS.
    if (env.ORYX_DEV_ALLOW_INSECURE_API !== "1") {
      throw new Error("ORYX_DEV_API_ORIGIN must use HTTPS or a loopback address. Set ORYX_DEV_ALLOW_INSECURE_API=1 to use plain HTTP knowingly.");
    }
    console.warn(`[oryx] Proxying /api to ${apiOrigin} over plain HTTP: credentials are not encrypted in transit.`);
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { ORYX_WEB_COMMIT: JSON.stringify(process.env.RELEASE_SHA ?? "") },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    ...(apiOrigin || gatewayOrigin ? { proxy: {
      ...(apiOrigin ? { "/api": { target: apiOrigin, changeOrigin: true } } : {}),
      ...(gatewayOrigin ? { "/realtime": { target: gatewayOrigin, changeOrigin: true, ws: true } } : {}),
    } } : {}),
  },
  build: { outDir: "dist", sourcemap: false, rolldownOptions: { output: {
    // Build files are cached by browsers as never changing. Raise this to give every file a new name when cached copies
    // must be discarded: generation 2 replaces files a broken deploy served empty on 2026-10-16.
    entryFileNames: `assets/[name]-[hash]-g${cacheGeneration}.js`, chunkFileNames: `assets/[name]-[hash]-g${cacheGeneration}.js`, assetFileNames: `assets/[name]-[hash]-g${cacheGeneration}[extname]`,
  } } },
  // CI runners are slower: interaction tests get longer than the 5s default, and a retry keeps one slow run from failing a deploy.
  test: { maxWorkers: 4, ...(process.env.CI ? { testTimeout: 30_000, retry: 2 } : {}), setupFiles: ["./src/test/setup.ts"] },
});
