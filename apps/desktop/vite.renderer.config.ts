import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./src/connection", import.meta.url)),
  // The setup page has its own port in development, so it never takes 5173 from the web application.
  server: { port: 5273, strictPort: true },
  build: {
    assetsInlineLimit: 0,
    rollupOptions: { input: fileURLToPath(new URL("./src/connection/index.html", import.meta.url)) },
  },
});
