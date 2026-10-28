import { spawn } from "node:child_process";
export interface Command { executable: string; args: readonly string[]; env?: NodeJS.ProcessEnv; }
export interface Output { code: number; stdout: string; stderr: string; }
export type Run = (command: Command) => Promise<Output>;
export const run: Run = async (command) => new Promise((resolve, reject) => {
  const child = spawn(command.executable, [...command.args], { env: { ...process.env, ...command.env }, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = ""; let stderr = ""; let overflow = false;
  const timer = setTimeout(() => child.kill("SIGTERM"), 15 * 60_000);
  child.stdout.on("data", (bytes: Buffer) => {
    stdout += bytes.toString();
    if (stdout.length > 32 * 1024 * 1024) { overflow = true; child.kill("SIGTERM"); }
  });
  child.stderr.on("data", (bytes: Buffer) => { stderr = `${stderr}${bytes.toString()}`.slice(-16_000); });
  child.on("error", (error) => { clearTimeout(timer); reject(error); });
  child.on("close", (code) => { clearTimeout(timer); if (overflow) reject(new Error("Command output exceeds limit")); else resolve({ code: code ?? -1, stdout, stderr }); });
});
export async function checked(run: Run, command: Command): Promise<string> {
  const result = await run(command);
  if (result.code !== 0) throw new Error(`${command.executable} failed (${result.code}): ${result.stderr.slice(-4000)}`);
  return result.stdout.trim();
}
