import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./src/updates", import.meta.url)),
  // The setup page has its own port in development, so it never takes 5173 from the web application.
  server: { port: 5275, strictPort: true },
  build: {
    // With `root` moved to src/updates, Forge's relative output would land there and be left out of the
    // packaged app; main.ts loads the page from .vite/renderer/update_window next to .vite/build.
    outDir: fileURLToPath(new URL("./.vite/renderer/update_window", import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL("./src/updates/index.html", import.meta.url)) },
  },
});
