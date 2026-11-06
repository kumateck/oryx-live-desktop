import { createPublicKey } from "node:crypto";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { defaultUpdateOrigin, parseBuildUpdateOrigin } from "./src/updates/source.ts";

const updateKey = (process.env.ORYX_DESKTOP_UPDATE_PUBLIC_KEY ?? "").trim();
if (updateKey && createPublicKey(updateKey).asymmetricKeyType !== "ed25519") throw new Error("Desktop updates require an Ed25519 verification key");
// Staging or test builds may name another release source; every other build checks the default.
const updateOrigin = parseBuildUpdateOrigin((process.env.ORYX_DESKTOP_UPDATE_ORIGIN ?? "").trim() || defaultUpdateOrigin);

export default defineConfig({
  define: { ORYX_DESKTOP_UPDATE_PUBLIC_KEY: JSON.stringify(updateKey), ORYX_DESKTOP_UPDATE_ORIGIN: JSON.stringify(updateOrigin) },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      formats: ["cjs"],
      fileName: () => "main.cjs",
    },
    rollupOptions: { external: ["electron"] },
  },
});
