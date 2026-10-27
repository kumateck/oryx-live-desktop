import { createPublicKey } from "node:crypto";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const updateKey = (process.env.ORYX_DESKTOP_UPDATE_PUBLIC_KEY ?? "").trim();
if (updateKey && createPublicKey(updateKey).asymmetricKeyType !== "ed25519") throw new Error("Desktop updates require an Ed25519 verification key");

export default defineConfig({
  define: { ORYX_DESKTOP_UPDATE_PUBLIC_KEY: JSON.stringify(updateKey) },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },
    rollupOptions: { external: ["electron"] },
  },
});
