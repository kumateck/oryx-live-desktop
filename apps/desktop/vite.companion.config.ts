import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL("./src/companion/renderer", import.meta.url)),
  server: { port: 5274, strictPort: true },
  build: { outDir: fileURLToPath(new URL("./.vite/renderer/companion_window", import.meta.url)), emptyOutDir: true, assetsInlineLimit: 0 },
});
