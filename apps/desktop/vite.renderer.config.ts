import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./src/connection", import.meta.url)),
  build: { rollupOptions: { input: fileURLToPath(new URL("./src/connection/index.html", import.meta.url)) } },
});
