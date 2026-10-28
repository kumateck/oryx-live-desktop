import { isAbsolute, relative, resolve, sep } from "node:path";

export interface Config {
  branch: string; repository: string; repo: string; root: string; state: string; bun: string;
  site: string; api: string; gateway: string | null; shellFloor: string; alertHook: string | null;
  retentionDays: number; maxFailures: number; commandTimeoutMs: number;
}
export function origin(value: string): string {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Use an HTTP(S) origin without credentials, path, query or fragment");
  if (!/^[a-zA-Z0-9_.:[\]-]+$/.test(url.hostname)) throw new Error("Use a DNS hostname or IP address without configuration syntax");
  return url.origin;
}
export function within(parent: string, child: string): boolean {
  const suffix = relative(parent, child);
  return Boolean(suffix) && suffix !== ".." && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix);
}
export function absolute(value: string): string {
  if (!isAbsolute(value) || resolve(value) === "/" || /[\s\x00-\x1f;$`{}]/.test(value)) throw new Error("Deployment paths must be absolute, non-root paths without whitespace or shell syntax");
  return resolve(value);
}
export function version(value: string): number[] {
  if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error("Use a numeric major.minor.patch shell version");
  return value.split(".").map(Number);
}
export function atLeast(installed: string, minimum: string): boolean {
  const left = version(installed); const right = version(minimum);
  for (let index = 0; index < 3; index += 1) { const delta = (left[index] ?? 0) - (right[index] ?? 0); if (delta) return delta > 0; }
  return true;
}
export function readConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const get = (key: string, fallback?: string) => { const value = env[key] ?? fallback; if (!value) throw new Error(`Set ${key} in the customer .env file`); return value; };
  const number = (key: string, fallback: number, minimum: number) => { const value = Number(env[key] ?? fallback); if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`Invalid ${key}`); return value; };
  const branch = get("ORYX_DEPLOY_BRANCH", "entrance-server");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(branch) || branch.includes("//") || branch.endsWith("/")) throw new Error("Invalid deployment branch");
  const repo = absolute(get("ORYX_DEPLOY_REPO", "/opt/oryx/source"));
  const root = absolute(get("ORYX_DEPLOY_ROOT", "/srv/oryx"));
  const state = absolute(get("ORYX_DEPLOY_STATE", "/var/lib/oryx-deploy"));
  for (const [left, right] of [[repo, root], [repo, state], [root, state]]) {
    if (left && right && (left === right || within(left, right) || within(right, left))) throw new Error("Repository, release and state directories must be separate");
  }
  const shellFloor = get("ORYX_INSTALLED_SHELL_MIN_VERSION", "0.1.0"); version(shellFloor);
  const repository = get("ORYX_GIT_REPOSITORY", "git@github.com:kumateck/oryx-live-desktop.git");
  if (!/^git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\.git$/.test(repository)) throw new Error("Use a GitHub SSH repository and a read-only deploy key");
  return { branch, repository, repo, root, state, bun: absolute(get("ORYX_BUN", "/var/lib/oryx-deploy/.bun/bin/bun")),
    site: origin(get("ORYX_SITE_URL")), api: origin(get("ORYX_API_ORIGIN")),
    gateway: env.ORYX_GATEWAY_UPSTREAM ? origin(env.ORYX_GATEWAY_UPSTREAM) : null,
    shellFloor, alertHook: env.ORYX_ALERT_HOOK ? absolute(env.ORYX_ALERT_HOOK) : null,
    retentionDays: number("ORYX_RETENTION_DAYS", 30, 30), maxFailures: number("ORYX_MAX_RELEASE_FAILURES", 3, 1),
    commandTimeoutMs: number("ORYX_BUILD_TIMEOUT_SECONDS", 1800, 60) * 1000 };
}
