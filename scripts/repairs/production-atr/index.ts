import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseCommand, type RepairCommand } from "./options.ts";

export function repairSql(command: RepairCommand): string {
  const values = Object.entries(command.target).map(([key, value]) =>
    `SET oryx_repair.${key.toLowerCase()} TO '${String(value).replaceAll("'", "''")}';`).join("\n");
  const readOnly = command.mode === "inspect" || !command.target.apply;
  const source = readFileSync(new URL(`${command.mode}.sql`, import.meta.url), "utf8");
  return `\\set ON_ERROR_STOP on\nSET standard_conforming_strings = on;\n${values}\n` +
    `BEGIN${readOnly ? " ISOLATION LEVEL REPEATABLE READ READ ONLY" : ""};\n` +
    `SET LOCAL search_path = public, pg_catalog;\nSET LOCAL lock_timeout = '3s';\nSET LOCAL statement_timeout = '30s';\n` +
    `DO $target$ BEGIN IF current_database() <> current_setting('oryx_repair.database') THEN\n` +
    `RAISE EXCEPTION 'Wrong database'; END IF; END $target$;\n${source}\nCOMMIT;\n`;
}

export function execute(command: RepairCommand): number {
  const { host, port, database } = command.target;
  // No shell, password arguments, psqlrc, interactive password prompts or automatic retries.
  const result = spawnSync("psql", ["-X", "-w", "--host", host, "--port", String(port), "--dbname", database,
    "--no-psqlrc", "--quiet", "--tuples-only", "--no-align"], {
    input: repairSql(command), encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PGCONNECT_TIMEOUT: "5", PGAPPNAME: "oryx-production-atr-repair" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw new Error(`Cannot execute psql: ${result.error.message}`);
  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = execute(parseCommand(process.argv.slice(2))); }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Repair failed"}\n`);
    process.exitCode = 1;
  }
}
