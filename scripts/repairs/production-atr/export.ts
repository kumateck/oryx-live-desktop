import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseCommand, type RepairCommand } from "./options.ts";
import { repairSql } from "./index.ts";

export function exportSql(directory: string, command: RepairCommand): string[] {
  if (!directory.trim()) throw new Error("An output directory is required");
  if (command.mode === "repair" && command.target.apply) {
    throw new Error("Do not pass --apply to export; separate preview.sql and apply.sql files are generated");
  }
  const { host, port, database, activity } = command.target;
  const inspect: RepairCommand = { mode: "inspect", target: { host, port, database, activity } };
  const files: { name: string; command: RepairCommand }[] = [{ name: "inspect.sql", command: inspect }];
  if (command.mode === "repair") files.push(
    { name: "preview.sql", command: { mode: "repair", target: { ...command.target, apply: false } } },
    { name: "apply.sql", command: { mode: "repair", target: { ...command.target, apply: true } } },
  );
  const rendered = files.map((file) => ({ name: file.name, sql: repairSql(file.command) }));
  const output = resolve(directory);
  // A new private directory avoids overwriting a reviewed bundle or following a
  // pre-existing directory symlink. No database connection is opened by export.
  mkdirSync(output, { mode: 0o700 });
  return rendered.map((file) => {
    const path = resolve(output, file.name);
    writeFileSync(path, file.sql, { flag: "wx", mode: 0o600 });
    return path;
  });
}

export function exportCommand(args: readonly string[]): string[] {
  const [directory, ...commandArgs] = args;
  if (!directory || directory.startsWith("--")) {
    throw new Error("Usage: bun scripts/repairs/production-atr/export.ts <new-output-directory> <inspect|repair> [options]");
  }
  return exportSql(directory, parseCommand(commandArgs));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${exportCommand(process.argv.slice(2)).join("\n")}\n`); }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Export failed"}\n`);
    process.exitCode = 1;
  }
}
