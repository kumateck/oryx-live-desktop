import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },
    rollupOptions: { external: ["electron"] },
  },
});
