import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { targetFromUrl, type RepairTarget } from "../formula-config/options.ts";

export interface ReservationRepairCommand {
  target: RepairTarget;
  migrationId: string;
  actorEmail: string;
  reason: string;
  apply: boolean;
  expectedToken: string;
}

export function parseCommand(args: readonly string[], environment: Readonly<Record<string, string | undefined>> = process.env): ReservationRepairCommand {
  const permitted = new Set(["--host", "--port", "--database", "--migration", "--actor-email", "--reason", "--expected-token", "--apply"]);
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (!key || !permitted.has(key) || values.has(key) || key === "--apply" && apply) throw new Error("Invalid or duplicate repair option");
    if (key === "--apply") { apply = true; continue; }
    const value = args[++index];
    if (!value || value.startsWith("--") || value.includes("\0")) throw new Error(`Missing value for ${key}`);
    values.set(key, value);
  }
  const fromUrl = environment.DATABASE_URL ? targetFromUrl(environment.DATABASE_URL) : null;
  const host = values.get("--host") ?? fromUrl?.host;
  const database = values.get("--database") ?? fromUrl?.database;
  const port = Number(values.get("--port") ?? fromUrl?.port ?? 5432);
  if (!host || !/^[a-zA-Z0-9._/-]+$/.test(host) || host.startsWith("-")
    || !database || !/^[a-zA-Z0-9_-]+$/.test(database) || database.startsWith("-")
    || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Supply a plain database host/name and valid port, or DATABASE_URL");
  if (fromUrl && (host !== fromUrl.host || database !== fromUrl.database || port !== fromUrl.port)) throw new Error("Explicit target must agree with DATABASE_URL");
  const migrationId = z.string().uuid().parse(values.get("--migration"));
  if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(migrationId)) throw new Error("Choose a nonempty replacement migration ID");
  const actorEmail = z.string().email().parse(values.get("--actor-email"));
  const reason = z.string().trim().min(10).max(1000).parse(values.get("--reason") ?? "Reconcile unissued reservations after opening-stock replacement");
  const expectedToken = values.get("--expected-token") ?? "";
  if (apply && !/^[a-f0-9]{64}$/.test(expectedToken)) throw new Error("Apply requires the exact reviewed --expected-token");
  return { target: { host, port, database, ...(fromUrl?.env ? { env: fromUrl.env } : {}) }, migrationId, actorEmail, reason, apply, expectedToken };
}

/** psql itself quotes substituted variables as SQL literals; no shell evaluates arguments. */
export function psqlArguments(command: ReservationRepairCommand): string[] {
  return ["-X", "-w", "--quiet", "--tuples-only", "--no-align", "--host", command.target.host,
    "--port", String(command.target.port), "--dbname", command.target.database,
    "--set", `expected_database=${command.target.database}`, "--set", `migration_id=${command.migrationId}`,
    "--set", `actor_email=${command.actorEmail}`, "--set", `reason=${command.reason}`,
    "--set", `apply=${command.apply}`, "--set", `expected_token=${command.expectedToken}`];
}

export function run(command: ReservationRepairCommand): number {
  const environment: NodeJS.ProcessEnv = { ...process.env, ...command.target.env, PGCONNECT_TIMEOUT: "10", PGAPPNAME: "oryx-migration-reservation-repair" };
  delete environment.DATABASE_URL;
  const source = readFileSync(new URL("repair.sql", import.meta.url), "utf8");
  const result = spawnSync("psql", psqlArguments(command), { input: source, encoding: "utf8", env: environment, maxBuffer: 16 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw new Error(`Cannot start psql: ${result.error.message}`);
  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = run(parseCommand(process.argv.slice(2))); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : "Reservation repair failed"}\n`); process.exitCode = 1; }
}
