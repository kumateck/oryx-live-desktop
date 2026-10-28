import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Web dependencies and bun.lock alone do not change the installed Electron shell.
// Desktop dependency updates must include apps/desktop/package.json.
export function desktopInput(path: string): boolean {
  return path.startsWith("apps/desktop/") || path === "assets/oryx-wordmark.svg" ||
    ["shared/desktop-updates.ts", "shared/alert-priority.ts", "shared/desktop-signing.ts", "shared/companion.ts"].includes(path) ||
    /^scripts\/(?:make-windows|check-desktop-signing|create-desktop-update|windows-[\w-]+)\.ts$/.test(path);
}

type GitReader = (args: string[]) => string;
const readGit: GitReader = (args) => execFileSync("git", args, { encoding: "utf8" });

export function publishedDesktopSource(output: string): string {
  // The SSH action includes CLI status messages alongside remote stdout.
  const records = [...output.matchAll(/^(?:out:\s*)?ORYX_DESKTOP_PUBLISHED_SHA=([a-f0-9]{40}|none)\r?$/gm)];
  const value = records[0]?.[1];
  if (records.length !== 1 || !value) throw new Error("Missing or ambiguous desktop publication response");
  return value === "none" ? "" : value;
}

export function changedDesktopInputs(base: string, head: string, git: GitReader = readGit): string[] {
  if (!/^[a-f0-9]{40}$/.test(head) || /^0{40}$/.test(head) || (base && (!/^[a-f0-9]{40}$/.test(base) || /^0{40}$/.test(base)))) {
    throw new Error("Desktop change detection requires full Git commit SHAs");
  }
  // An unmarked/legacy installation has never published the current native release.
  // Comparing only the latest web push would silently overlook that outstanding build.
  const paths = base
    ? git(["diff", "--name-only", "--no-renames", "-z", base, head])
    : git(["ls-tree", "-r", "--name-only", "-z", head]);
  return paths.split("\0").filter((path) => path && desktopInput(path));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const base = publishedDesktopSource(process.env.DESKTOP_PUBLISHED_OUTPUT ?? "");
  const paths = changedDesktopInputs(base, process.env.GITHUB_SHA ?? "");
  if (!base) console.log("No verified desktop publication: the first current installer must be built and published.");
  console.log(paths.length ? `Desktop build required:\n${paths.join("\n")}` : "Web-only release: Windows installer skipped.");
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `desktop_changed=${paths.length > 0}\n`);
}
