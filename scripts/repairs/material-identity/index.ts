import { spawnSync } from "node:child_process";
import { readFileSync, openSync, closeSync } from "node:fs";

const args = process.argv.slice(2);
const database = args[args.indexOf("--database") + 1];
const output = args[args.indexOf("--output") + 1];
if (!args.includes("--database") || !database || !/^[A-Za-z0-9_-]+$/.test(database) || !args.includes("--output") || !output)
  throw new Error("Usage: bun scripts/repairs/material-identity/index.ts --database NAME --output REPORT.json [--apply]. Supply PGHOST, PGPORT, PGUSER and a protected PGPASSFILE.");
const apply = args.includes("--apply");
const report = openSync(output, "wx", 0o600);
const result = spawnSync("psql", ["-X", "-w", "-qAt", "--dbname", database, "--set", `expected_database=${database}`, "--set", `apply=${apply ? "true" : "false"}`], {
  input: readFileSync(new URL("./rmg001.sql", import.meta.url), "utf8"), encoding: "utf8", stdio: ["pipe", report, "pipe"], maxBuffer: 8 * 1024 * 1024,
  env: { ...process.env, PGCONNECT_TIMEOUT: "7", PGAPPNAME: "oryx-rmg001-material-identity-repair" },
});
closeSync(report);
if (result.error || result.status !== 0) throw new Error(result.stderr.trim() || result.error?.message || "Repair failed; transaction rolled back.");
console.log(`${apply ? "Applied" : "Rehearsed and rolled back"} the two-batch repair; evidence saved to ${output}.`);
