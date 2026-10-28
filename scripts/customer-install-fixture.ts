import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

if (process.platform !== "linux" || process.getuid?.() !== 0 || process.env.ORYX_CUSTOMER_INSTALL_FIXTURE !== "container-only") {
  throw new Error("This root-owned installation fixture runs only in the disposable customer-validation Docker build stage.");
}
function run(command: string, args: string[], env = process.env): string {
  const result = spawnSync(command, args, { encoding: "utf8", env });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  if (result.stdout) process.stdout.write(result.stdout);
  return result.stdout;
}
run(process.execPath, ["deploy/customer-server/check-release.ts"]);
run(process.execPath, ["deploy/customer-server/check-nginx.ts"]);
run("nginx", ["-t", "-c", "/tmp/oryx-customer-nginx.conf"]);
mkdirSync("/etc/oryx-deploy", { recursive: true, mode: 0o750 });
writeFileSync("/etc/oryx-deploy/customer.env", "ORYX_API_ORIGIN=http://127.0.0.1:18091\nORYX_SITE_URL=http://127.0.0.1:18090\n", { mode: 0o640 });
// A build container has no systemd PID 1. Record service-control requests; verify the real units offline below.
mkdirSync("/tmp/oryx-systemctl-fixture", { recursive: true });
writeFileSync("/tmp/oryx-systemctl-fixture/systemctl", `#!${process.execPath}\nrequire('node:fs').appendFileSync('/tmp/oryx-systemctl.log', process.argv.slice(2).join(' ')+'\\n');\n`, { mode: 0o755 });
const env = { ...process.env, PATH: `/tmp/oryx-systemctl-fixture:${process.env.PATH ?? ""}` };
run(process.execPath, ["deploy/customer-server/install.ts"], env);
run("systemd-analyze", ["verify", "/etc/systemd/system/oryx-deploy.service", "/etc/systemd/system/oryx-deploy.timer"]);
run("runuser", ["-u", "oryx-deploy", "--", process.execPath, "/opt/oryx/deploy-agent/cli.ts", "status"]);
const before = readFileSync("/etc/oryx-deploy/customer.env");
run(process.execPath, ["/opt/oryx/deploy-agent/uninstall.ts"], env);
if (!existsSync("/etc/nginx/sites-available/oryx-customer") || !before.equals(readFileSync("/etc/oryx-deploy/customer.env"))) throw new Error("Uninstall did not preserve customer configuration.");
if (existsSync("/etc/systemd/system/oryx-deploy.service") || existsSync("/etc/systemd/system/oryx-deploy.timer")) throw new Error("Uninstall left deployment units installed.");
// Confirm the old CI failure: the runner user cannot inspect a root:oryx-deploy 0750 configuration directory.
mkdirSync("/tmp/oryx-config-fixture", { mode: 0o700 });
writeFileSync("/tmp/oryx-config-fixture/preserved", "fixture");
const restricted = spawnSync("runuser", ["-u", "nobody", "--", "test", "-f", "/tmp/oryx-config-fixture/preserved"]);
if (restricted.status === 0) throw new Error("The permission-denial fixture was not effective.");
chmodSync("/tmp/oryx-config-fixture", 0o755);
if (!readFileSync("/tmp/oryx-systemctl.log", "utf8").includes("daemon-reload")) throw new Error("Installation did not request a unit reload.");
console.log("Legacy installation, Nginx, unit syntax, non-root status and preserved configuration verified in the disposable container.");
