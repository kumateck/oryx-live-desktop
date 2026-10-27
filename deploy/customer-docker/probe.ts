import { statfsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { object, parse } from "../customer-server/data.ts";
import { atLeast } from "../customer-server/config.ts";
import { requirements } from "./requirements.ts";
import { verifyApiConnectivity, verifyCriticalCompatibility } from "./probe-checks.ts";

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "api" && mode !== "compatibility") throw new Error("Use probe.ts api|compatibility <origin> <shell-floor> <requirements-file> <minimum-free-gb> [baseline-file]");
  const policy = requirements(parse(await readFile(process.argv[5] ?? "/repo/deploy/customer-docker/requirements.json", "utf8")));
  if (!atLeast(process.argv[4] ?? "", policy.minimumShellVersion)) throw new Error("Installed shell baseline is incompatible");
  if (mode === "api") {
    const disk = statfsSync("/");
    const minimumGb = Number(process.argv[6] ?? "10");
    if (!Number.isSafeInteger(minimumGb) || minimumGb < 1 || disk.bavail * disk.bsize < minimumGb * 1024 ** 3) throw new Error("Insufficient free disk in the Docker image store");
    await verifyApiConnectivity(process.argv[3] ?? "");
    console.log("API connectivity on sail and installed-shell baseline verified");
  } else {
    const baseline = object(parse(await readFile(process.argv[7] ?? "/repo/contracts/openapi/backend.v1.json", "utf8")));
    const result = await verifyCriticalCompatibility(process.argv[3] ?? "", baseline);
    for (const warning of result.warnings) console.warn(`[Compatibility:warning] ${warning}`);
    console.log(result.verified ? "Critical API contracts verified; unrelated OpenAPI differences are allowed" : "Compatibility evidence incomplete; no confirmed breaking changes found");
  }
}
await main().catch((error) => { console.error(error instanceof Error ? error.message : "Probe failed"); process.exitCode = 1; });
