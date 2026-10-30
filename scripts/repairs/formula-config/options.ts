import { uuidPattern } from "./recipe.ts";

/** `env` carries libpq settings (user, password, SSL mode) from DATABASE_URL; they reach psql only through its environment. */
export interface RepairTarget { host: string; port: number; database: string; env?: Record<string, string> }
export interface FindCommand { mode: "find"; target: RepairTarget; atr: string }
export interface RepairCommand {
  mode: "repair";
  target: RepairTarget;
  recipe: string;
  actor: string;
  reason: string;
  apply: boolean;
  /** Also rewrite the definition when checked, approved, rejected or submitted responses answered this question. */
  allowClosedResponses: boolean;
}
export type Command = FindCommand | RepairCommand;

const plainHost = /^[a-zA-Z0-9._/-]+$/;
const plainDatabase = /^[a-zA-Z0-9_-]+$/;
const sslModes = new Set(["disable", "allow", "prefer", "require", "verify-ca", "verify-full"]);

/**
 * Splits a postgres:// URL (normally DATABASE_URL from a git-ignored .env) into a target and libpq environment.
 * Errors never repeat the URL, so a password cannot leak into the terminal.
 */
export function targetFromUrl(raw: string): RepairTarget {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { throw new Error("DATABASE_URL is not a valid URL"); }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") throw new Error("DATABASE_URL must start with postgres:// or postgresql://");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!host || !plainHost.test(host) || host.startsWith("-")) throw new Error("DATABASE_URL needs a plain host name or IP address");
  if (!database || !plainDatabase.test(database)) throw new Error("DATABASE_URL needs a plain database name after the host");
  const port = url.port ? Number(url.port) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("DATABASE_URL has an invalid port");
  const known = new Set(["sslmode"]);
  for (const key of url.searchParams.keys()) if (!known.has(key)) throw new Error(`DATABASE_URL option ${key} is not supported; only sslmode is`);
  const env: Record<string, string> = {};
  if (url.username) env.PGUSER = decodeURIComponent(url.username);
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode !== null) {
    if (!sslModes.has(sslmode)) throw new Error("DATABASE_URL sslmode is not a libpq SSL mode");
    env.PGSSLMODE = sslmode;
  }
  return { host, port, database, env };
}

export function parseCommand(args: readonly string[], environment: Readonly<Record<string, string | undefined>> = process.env): Command {
  const [mode, ...rest] = args;
  if (mode !== "find" && mode !== "repair") throw new Error("Choose find or repair. See docs/formula-config-repairs.md.");
  const flags = new Set(mode === "repair" ? ["--apply", "--allow-closed-responses"] : []);
  const permitted = new Set(["--host", "--port", "--database", ...(mode === "find" ? ["--atr"] : ["--recipe", "--actor", "--reason"]), ...flags]);
  const values = new Map<string, string>();
  const switches = new Set<string>();
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
    return value.toLowerCase();
  };
  const fromUrl = environment.DATABASE_URL?.trim() ? targetFromUrl(environment.DATABASE_URL) : null;
  const host = values.get("--host") ?? fromUrl?.host ?? required("--host");
  const database = values.get("--database") ?? fromUrl?.database ?? required("--database");
  // libpq treats a dbname containing '=' or a URI as a connection string: never allow it.
  if (host.startsWith("-") || database.startsWith("-") || !plainHost.test(host) || !plainDatabase.test(database)) {
    throw new Error("Use a plain host/socket directory and database name, not a connection string");
  }
  const portText = values.get("--port") ?? String(fromUrl?.port ?? 5432);
  if (!/^[1-9]\d{0,4}$/.test(portText) || Number(portText) > 65535) throw new Error("Invalid port");
  // Options given next to DATABASE_URL must agree with it, so a typo cannot silently pick another database.
  if (fromUrl && (host !== fromUrl.host || database !== fromUrl.database || Number(portText) !== fromUrl.port)) {
    throw new Error("--host, --port or --database disagree with DATABASE_URL");
  }
  const target: RepairTarget = { host, port: Number(portText), database, ...(fromUrl?.env ? { env: fromUrl.env } : {}) };
  if (mode === "find") return { mode, target, atr: uuid("--atr") };
  const reason = required("--reason").trim();
  if (reason.length < 10 || reason.length > 1000) throw new Error("--reason must contain 10–1000 characters");
  const recipe = required("--recipe");
  if (!recipe.endsWith(".json")) throw new Error("--recipe must be a .json file");
  return { mode, target, recipe, actor: uuid("--actor"), reason, apply: switches.has("--apply"), allowClosedResponses: switches.has("--allow-closed-responses") };
}
