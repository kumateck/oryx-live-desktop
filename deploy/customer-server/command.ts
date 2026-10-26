import { spawn } from "node:child_process";
import { open } from "node:fs/promises";
import { dirname } from "node:path";
import type { Config } from "./config.ts";

export interface Command { executable: string; args: readonly string[]; cwd?: string; log?: string; input?: string; }
export type Runner = (command: Command) => Promise<string>;
export function commandRunner(config: Config): Runner {
  return async (command) => {
    const log = command.log ? await open(command.log, "a", 0o600) : null;
    try {
      return await new Promise<string>((resolve, reject) => {
        const child = spawn(command.executable, [...command.args], { cwd: command.cwd ?? config.repo, detached: true,
          env: { ...process.env, PATH: `${dirname(config.bun)}:${process.env.PATH ?? "/usr/bin:/bin"}`, CI: "1", HUSKY: "0",
            ELECTRON_SKIP_BINARY_DOWNLOAD: "1", GIT_TERMINAL_PROMPT: "0", GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes",
            NODE_OPTIONS: "--max-old-space-size=6144" },
          stdio: ["pipe", log ? log.fd : "pipe", log ? log.fd : "pipe"] });
        let output = "";
        const collect = (bytes: Buffer) => { output = `${output}${bytes.toString()}`.slice(-64_000); };
        child.stdout?.on("data", collect); child.stderr?.on("data", collect);
        const timer = setTimeout(() => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* already ended */ } } }, config.commandTimeoutMs);
        const cancel = () => { if (child.pid) { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already ended */ } } };
        process.once("SIGTERM", cancel); process.once("SIGINT", cancel);
        const clean = () => { clearTimeout(timer); process.off("SIGTERM", cancel); process.off("SIGINT", cancel); };
        child.on("error", (error) => { clean(); reject(error); });
        child.on("close", (code) => { clean(); if (code === 0) resolve(output.trim()); else reject(new Error(`${command.executable} exited ${code ?? "without a status"}${command.log ? `; see ${command.log}` : `: ${output}`}`)); });
        child.stdin?.end(command.input ?? "");
      });
    } finally { await log?.close(); }
  };
}
