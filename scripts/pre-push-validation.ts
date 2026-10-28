import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function outgoingPushCommits(input: string): string[] {
  const commits = new Set<string>();
  for (const line of input.trim().split("\n").filter(Boolean)) {
    const parts = line.trim().split(/\s+/);
    const sha = parts[1];
    if (parts.length !== 4 || !sha || !/^[a-f0-9]{40}$/.test(sha) || !/^[a-f0-9]{40}$/.test(parts[3] ?? "")) throw new Error("Invalid pre-push ref input; validation was not skipped.");
    if (parts[2]?.startsWith("refs/heads/") && !/^0{40}$/.test(sha)) commits.add(sha);
  }
  return [...commits];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const commits = outgoingPushCommits(readFileSync(0, "utf8"));
    if (commits.length) {
      for (const sha of commits) {
        const result = spawnSync(process.execPath, ["scripts/customer-release-validation.ts", "--sha", sha], { stdio: "inherit" });
        if (result.error || result.status !== 0) throw new Error("Push blocked: customer release validation failed. Fix the failure and push again.");
      }
    } else {
      const result = spawnSync("bun", ["run", "check"], { stdio: "inherit", env: { ...process.env, CI: "1" } });
      if (result.error || result.status !== 0) throw new Error("Push blocked: repository validation failed.");
    }
  } catch (error) { console.error(error instanceof Error ? error.message : "Pre-push validation failed."); process.exitCode = 1; }
}
