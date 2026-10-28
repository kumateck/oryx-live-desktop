import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";

if (process.platform !== "linux" || process.getuid?.() !== 0) throw new Error("Run uninstall as root on Linux");
for (const args of [["disable", "--now", "oryx-deploy.timer"], ["stop", "oryx-deploy.service"]]) spawnSync("systemctl", args, { stdio: "inherit" });
await rm("/etc/systemd/system/oryx-deploy.timer", { force: true });
await rm("/etc/systemd/system/oryx-deploy.service", { force: true });
spawnSync("systemctl", ["daemon-reload"], { stdio: "inherit" });
// Keep Nginx serving the last release, plus customer configuration, keys, releases, and history.
console.log("Deployment automation removed. The current site and all customer-owned data/configuration remain available.");
