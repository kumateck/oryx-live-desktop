export interface RepairTarget {
  host: string;
  port: number;
  database: string;
  activity: string;
}
export interface AtrRepair extends RepairTarget {
  step: string;
  product: string;
  batch: string;
  ard: string;
  stage: number;
  actor: string;
  reason: string;
  expectedAssignments: number;
  repairProcedure: boolean;
  apply: boolean;
}
export type RepairCommand = { mode: "inspect"; target: RepairTarget } | { mode: "repair"; target: AtrRepair };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseCommand(args: readonly string[]): RepairCommand {
  const [mode, ...rest] = args;
  if (mode !== "inspect" && mode !== "repair") throw new Error("Choose inspect or repair. See docs/production-activity-repairs.md.");
  const values = new Map<string, string>();
  const switches = new Set<string>();
  const flags = new Set(["--apply", "--repair-procedure"]);
  const permitted = new Set(["--host", "--port", "--database", "--activity", ...(mode === "repair"
    ? ["--step", "--product", "--batch", "--ard", "--stage", "--actor", "--reason", "--expected-assignments", ...flags] : [])]);
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key || !permitted.has(key) || values.has(key) || switches.has(key)) throw new Error(`Invalid or duplicate option: ${key}`);
    if (flags.has(key)) { switches.add(key); continue; }
    const value = rest[++index];
    if (!value || value.startsWith("--") || value.includes("\0")) throw new Error(`Missing or invalid value for ${key}`);
    values.set(key, value);
  }
  const required = (key: string) => {
    const value = values.get(key);
    if (!value?.trim()) throw new Error(`${key} is required`);
    return value;
  };
  const uuid = (key: string) => {
    const value = required(key);
    if (!uuidPattern.test(value) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value)) throw new Error(`${key} must be a non-empty UUID`);
    return value;
  };
  const positive = (key: string, fallback?: string) => {
    const value = values.get(key) ?? fallback ?? required(key);
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${key} must be a positive integer`);
    return Number(value);
  };
  const host = required("--host");
  const database = required("--database");
  // libpq treats a dbname containing '=' or a URI as a connection string: never allow it.
  if (host.startsWith("-") || database.startsWith("-") || !/^[a-zA-Z0-9._/-]+$/.test(host) || !/^[a-zA-Z0-9_-]+$/.test(database)) throw new Error("Use a plain host/socket directory and database name, not a connection string");
  const port = positive("--port", "5432");
  if (port > 65535) throw new Error("Invalid port");
  const target: RepairTarget = { host, port, database, activity: uuid("--activity") };
  if (mode === "inspect") return { mode, target };
  const stageName = required("--stage").toLowerCase();
  const stage = ["intermediate", "bulk", "finished"].indexOf(stageName);
  if (stage < 0) throw new Error("--stage must be intermediate, bulk or finished; it cannot be inferred from step order");
  const reason = required("--reason").trim();
  if (reason.length < 10 || reason.length > 1000) throw new Error("--reason must contain 10–1000 characters");
  return { mode, target: { ...target, step: uuid("--step"), product: uuid("--product"), batch: required("--batch"),
    ard: uuid("--ard"), stage, actor: uuid("--actor"), reason, expectedAssignments: positive("--expected-assignments"),
    repairProcedure: switches.has("--repair-procedure"), apply: switches.has("--apply") } };
}
