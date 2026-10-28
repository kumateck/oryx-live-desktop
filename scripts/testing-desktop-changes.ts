import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { jsonObject, parseJson } from "../shared/desktop-updates.ts";

// Web dependencies and bun.lock alone do not change the installed Electron shell.
// Desktop dependency updates must include apps/desktop/package.json.
export function desktopInput(path: string): boolean {
  return path.startsWith("apps/desktop/") || path === "assets/oryx-wordmark.svg" ||
    ["shared/desktop-updates.ts", "shared/alert-priority.ts", "shared/desktop-signing.ts", "shared/companion.ts"].includes(path) ||
    /^scripts\/(?:make-windows|check-desktop-signing|create-desktop-update|windows-[\w-]+)\.ts$/.test(path);
}

export function changedDesktopInputs(base: string, head: string): string[] {
  if (!/^[a-f0-9]{40}$/.test(head) || (base && !/^[a-f0-9]{40}$/.test(base))) {
    throw new Error("Desktop change detection requires full Git commit SHAs");
  }
  const git = (args: string[]) => execFileSync("git", args, { encoding: "utf8" });
  const parent = !base || /^0{40}$/.test(base)
    ? git(["rev-list", "--parents", "-n", "1", head]).trim().split(" ")[1]
    : base;
  const paths = parent
    ? git(["diff", "--name-only", "--no-renames", "-z", parent, head])
    : git(["ls-tree", "-r", "--name-only", "-z", head]);
  return paths.split("\0").filter((path) => path && desktopInput(path));
}

export function successfulTestingCommit(text: string): string {
  const body = jsonObject(parseJson(text));
  if (!Array.isArray(body.workflow_runs)) throw new Error("Invalid testing workflow history");
  if (!body.workflow_runs.length) return "";
  const run = jsonObject(body.workflow_runs[0] ?? null);
  if (run.head_branch !== "testing" || run.event !== "push" || run.conclusion !== "success" ||
    typeof run.head_sha !== "string" || !/^[a-f0-9]{40}$/.test(run.head_sha)) {
    throw new Error("Testing change detection requires a successful testing push run");
  }
  return run.head_sha;
}

async function comparisonBase(): Promise<string> {
  const fallback = process.env.DESKTOP_DIFF_BASE ?? "";
  if (process.env.GITHUB_REF !== "refs/heads/testing" || !["push", "workflow_dispatch"].includes(process.env.GITHUB_EVENT_NAME ?? "")) return fallback;
  const repository = process.env.GITHUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !token) throw new Error("Missing GitHub configuration for testing desktop change detection");
  // Include native changes from failed runs, even if the next push changes only web files.
  const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/customer-docker.yml/runs?branch=testing&event=push&status=success&per_page=1`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Could not read testing workflow history: HTTP ${response.status}`);
  return successfulTestingCommit(await response.text()) || fallback;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const paths = changedDesktopInputs(await comparisonBase(), process.env.GITHUB_SHA ?? "");
  console.log(paths.length ? `Desktop build required:\n${paths.join("\n")}` : "Web-only release: Windows installer skipped.");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `desktop_changed=${paths.length > 0}\n`);
}
