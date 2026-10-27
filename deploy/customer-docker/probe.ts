import { statfsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { parse } from "../customer-server/data.ts";
import { atLeast } from "../customer-server/config.ts";
import { compatibility } from "../customer-server/release.ts";
import { verifyApiConnectivity, verifySwaggerContract } from "./probe-checks.ts";

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "api" && mode !== "swagger") throw new Error("Use probe.ts api|swagger <origin> <shell-floor> <policy-file> <minimum-free-gb>");
  const policy = compatibility(parse(await readFile(process.argv[5] ?? "/repo/deploy/customer-server/release.json", "utf8")));
  if (!atLeast(process.argv[4] ?? "", policy.minimumShellVersion)) throw new Error("Installed shell baseline is incompatible");
  if (mode === "api") {
    const disk = statfsSync("/");
    const minimumGb = Number(process.argv[6] ?? "10");
    if (!Number.isSafeInteger(minimumGb) || minimumGb < 1 || disk.bavail * disk.bsize < minimumGb * 1024 ** 3) throw new Error("Insufficient free disk in the Docker image store");
    await verifyApiConnectivity(process.argv[3] ?? "");
    console.log("API connectivity on sail and installed-shell baseline verified");
  } else {
    await verifySwaggerContract(process.argv[3] ?? "", policy);
    console.log("Local Swagger contract fingerprint verified through Linux host networking");
  }
}
await main().catch((error) => { console.error(error instanceof Error ? error.message : "Probe failed"); process.exitCode = 1; });
