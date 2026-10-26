import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { DeploymentAgent } from "./agent.ts";
import { commandRunner } from "./command.ts";
import { absolute, atLeast, readConfig } from "./config.ts";
import { backendFingerprint } from "./health.ts";
import { loadState } from "./state.ts";

export async function main(args: string[]): Promise<void> {
  const envIndex = args.indexOf("--env");
  const envFile = envIndex >= 0 ? args[envIndex + 1] : "/etc/oryx-deploy/customer.env";
  if (!envFile) throw new Error("Specify the customer .env path");
  const config = readConfig(parseEnv(await readFile(absolute(envFile), "utf8")));
  if (!atLeast(process.versions.node, "22.22.0")) throw new Error("Node.js 22.22 or newer is required; Node.js 24 is recommended");
  if (process.getuid?.() === 0) throw new Error("Run deployment commands as oryx-deploy, never root");
  if (process.platform !== "linux") throw new Error("Customer deployment commands require Linux and util-linux flock");
  const filtered = args.filter((value, index) => value !== "--locked" && (envIndex < 0 || (index !== envIndex && index !== envIndex + 1)));
  const action = filtered[0] ?? "status";
  if (action === "status") { process.stdout.write(`${JSON.stringify(await loadState(config), null, 2)}\n`); return; }
  if (action === "backend-fingerprint") { process.stdout.write(`${await backendFingerprint(config, fetch)}\n`); return; }
  if (!args.includes("--locked")) {
    await mkdir(config.state, { recursive: true });
    await mkdir(config.root, { recursive: true });
    const code = await new Promise<number>((resolve, reject) => {
      const locking = action === "poll" ? ["--nonblock", "--conflict-exit-code", "0"] : ["--wait", "3600", "--conflict-exit-code", "75"];
      const child = spawn("flock", [...locking, join(config.root, ".deploy.lock"), process.execPath, fileURLToPath(import.meta.url), ...args, "--locked"], { stdio: "inherit" });
      child.on("error", reject); child.on("exit", (code) => resolve(code ?? 1));
    });
    if (code) throw new Error(`Deployment command failed (${code})`);
    return;
  }
  const agent = new DeploymentAgent(config, { run: commandRunner(config), fetch, now: () => new Date(), sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) });
  if (action === "poll") { await agent.poll(); return; }
  if (action === "pause" || action === "resume" || action === "retry" || action === "rollback" || action === "prune") { await agent.control(action, filtered[1]); return; }
  throw new Error("Commands: poll, status, pause, resume, retry <SHA>, rollback [SHA], prune, backend-fingerprint");
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) void main(process.argv.slice(2)).catch((error: Error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
