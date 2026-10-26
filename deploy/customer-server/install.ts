import { spawnSync } from "node:child_process";
import { chmod, chown, copyFile, lstat, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { absolute, readConfig } from "./config.ts";
import { exists } from "./data.ts";
import { nginxConfiguration } from "./nginx.ts";

function run(executable: string, args: string[]): string {
  const result = spawnSync(executable, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.error || result.status !== 0) throw new Error(`${executable} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout.trim();
}
export async function install(args: string[]): Promise<void> {
  if (process.platform !== "linux" || process.getuid?.() !== 0) throw new Error("Run the installer as root on Linux; deployments themselves use oryx-deploy");
  const envIndex = args.indexOf("--env"); const envFile = absolute(envIndex < 0 ? "/etc/oryx-deploy/customer.env" : args[envIndex + 1] ?? "");
  const stat = await lstat(envFile);
  if (stat.isSymbolicLink() || stat.uid !== 0 || (stat.mode & 0o022) !== 0) throw new Error("Customer .env must be root-owned and not writable by group or other users");
  const env = parseEnv(await readFile(envFile, "utf8")); const config = readConfig(env);
  if (spawnSync("id", ["oryx-deploy"]).status !== 0) run("useradd", ["--system", "--create-home", "--home-dir", "/var/lib/oryx-deploy", "--shell", "/bin/bash", "oryx-deploy"]);
  const uid = Number(run("id", ["-u", "oryx-deploy"])); const gid = Number(run("id", ["-g", "oryx-deploy"]));
  if (!uid) throw new Error("Deployment user cannot be root");
  run("flock", ["--version"]); run("git", ["--version"]); run("nginx", ["-v"]);
  // Stop automation during an explicit install/upgrade; interrupted work is recovered on its next poll.
  spawnSync("systemctl", ["stop", "oryx-deploy.timer", "oryx-deploy.service"], { stdio: "ignore" });
  for (const path of [config.root, config.state, join(config.root, "releases"), join(config.root, "shared"), join(config.state, "worktrees"), join(config.state, "logs"), dirname(config.repo), config.repo]) {
    await mkdir(path, { recursive: true }); if ((await lstat(path)).isSymbolicLink()) throw new Error("Managed paths must not be symlinks");
    if (path !== dirname(config.repo)) { await chown(path, uid, gid); await chmod(path, path === config.root || path.startsWith(`${config.root}/`) ? 0o755 : 0o750); }
  }
  await chown(envFile, 0, gid); await chmod(envFile, 0o640);
  if (dirname(envFile) === "/etc/oryx-deploy") { await chown(dirname(envFile), 0, gid); await chmod(dirname(envFile), 0o750); }
  const agentDirectory = "/opt/oryx/deploy-agent"; await mkdir(agentDirectory, { recursive: true });
  if ((await lstat(agentDirectory)).isSymbolicLink()) throw new Error("Agent directory must not be a symlink");
  await chown(agentDirectory, 0, 0); await chmod(agentDirectory, 0o755);
  await writeFile(join(agentDirectory, "package.json"), '{"type":"module"}\n', { mode: 0o644 });
  const source = dirname(fileURLToPath(import.meta.url));
  for (const name of await readdir(source)) if (name.endsWith(".ts") || name.endsWith(".service.in") || name.endsWith(".timer")) {
    const path = join(agentDirectory, name); const temporary = `${path}.${randomUUID()}.tmp`;
    await copyFile(join(source, name), temporary); await chown(temporary, 0, 0); await chmod(temporary, 0o644); await rename(temporary, path);
  }
  // Credentials/known_hosts and the source clone are deliberately prepared by the deployment user.
  const node = absolute(process.execPath);
  let service = await readFile(join(source, "oryx-deploy.service.in"), "utf8");
  for (const [key, value] of Object.entries({ NODE: node, AGENT: agentDirectory, ENV: envFile, REPO: config.repo, ROOT: config.root, STATE: config.state })) service = service.replaceAll(`@${key}@`, value);
  const timer = await readFile(join(source, "oryx-deploy.timer"), "utf8");
  await writeFile("/etc/systemd/system/oryx-deploy.service", service, { mode: 0o644 });
  await writeFile("/etc/systemd/system/oryx-deploy.timer", timer, { mode: 0o644 });
  const nginxPath = "/etc/nginx/sites-available/oryx-customer";
  const rendered = nginxConfiguration(config, env);
  if (await exists(nginxPath) && (await lstat(nginxPath)).isSymbolicLink()) throw new Error("Generated Nginx configuration must be a regular file");
  const previousNginx = await exists(nginxPath) ? await readFile(nginxPath, "utf8") : null;
  if (previousNginx !== null && previousNginx !== rendered && !args.includes("--replace-nginx")) throw new Error("Nginx configuration exists; review changes and pass --replace-nginx to replace it");
  await mkdir(dirname(nginxPath), { recursive: true }); await writeFile(nginxPath, rendered, { mode: 0o644 });
  const enabled = "/etc/nginx/sites-enabled/oryx-customer";
  const wasEnabled = await exists(enabled);
  if (!wasEnabled) await symlink(nginxPath, enabled);
  try { run("nginx", ["-t"]); }
  catch (error) {
    if (previousNginx === null) await rm(nginxPath, { force: true }); else await writeFile(nginxPath, previousNginx);
    if (!wasEnabled) await rm(enabled, { force: true });
    throw error;
  }
  run("systemctl", ["daemon-reload"]);
  process.stdout.write("Installed agent and units. Complete SSH, Bun and source-clone setup, reload Nginx, and enable the timer as described in README.md. No deployment was started.\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void install(process.argv.slice(2)).catch((error: Error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
