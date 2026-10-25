import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["electron"],
      output: {
        format: "cjs",
        entryFileNames: "companion-preload.cjs",
        codeSplitting: false,
      },
    },
  },
  plugins: [{
    name: "sandboxed-preload-output",
    config(config) {
      // Forge supplies this legacy default; Vite 8 uses codeSplitting instead.
      const output = config.build?.rollupOptions?.output;
      if (output && !Array.isArray(output)) delete output.inlineDynamicImports;
    },
  }],
});
