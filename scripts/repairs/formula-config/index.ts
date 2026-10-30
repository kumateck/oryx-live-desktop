import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseCommand, type Command, type RepairTarget } from "./options.ts";
import { loadRecipe, type Recipe } from "./recipe.ts";
import { buildPlan, type Completeness, type Loaded, type Plan } from "./plan.ts";

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** Wraps one SQL file in the safety header: database guard, timeouts, and a read-only transaction unless writing. */
export function scriptSql(file: "find" | "load" | "repair", target: RepairTarget, settings: Record<string, string>): string {
  const values = Object.entries({ database: target.database, ...settings })
    .map(([key, value]) => `SET oryx_repair.${key.toLowerCase()} TO ${literal(value)};`).join("\n");
  const readOnly = file !== "repair";
  const source = readFileSync(new URL(`${file}.sql`, import.meta.url), "utf8");
  return `\\set ON_ERROR_STOP on\nSET standard_conforming_strings = on;\n${values}\n` +
    `BEGIN${readOnly ? " ISOLATION LEVEL REPEATABLE READ READ ONLY" : ""};\n` +
    `SET LOCAL search_path = public, pg_catalog;\nSET LOCAL lock_timeout = '3s';\nSET LOCAL statement_timeout = '30s';\n` +
    `DO $target$ BEGIN IF current_database() <> current_setting('oryx_repair.database') THEN\n` +
    `RAISE EXCEPTION 'Wrong database'; END IF; END $target$;\n${source}\nCOMMIT;\n`;
}

/** The settings the write transaction re-checks. */
export function repairSettings(recipe: Recipe, plan: Plan, actor: string, reason: string, allowClosed: boolean): Record<string, string> {
  return { question: recipe.questionId, expectedsha: recipe.expectedDefinitionSha256, newdefinition: plan.definitionAfter,
    newsha: plan.newSha256, actor, reason, allowclosed: String(allowClosed), answers: JSON.stringify(plan.answers),
    recipe: JSON.stringify(recipe) };
}

const withoutUrl = (env: NodeJS.ProcessEnv) => { const copy = { ...env }; delete copy.DATABASE_URL; return copy; };

function psql(target: RepairTarget, input: string): { status: number; stdout: string } {
  // No shell, password arguments, psqlrc, interactive password prompts or automatic retries.
  const result = spawnSync("psql", ["-X", "-w", "--host", target.host, "--port", String(target.port), "--dbname", target.database,
    "--no-psqlrc", "--quiet", "--tuples-only", "--no-align"], {
    input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    // DATABASE_URL itself is not passed on: psql gets only the split-out libpq settings.
    env: { ...withoutUrl(process.env), ...target.env, PGCONNECT_TIMEOUT: "5", PGAPPNAME: "oryx-formula-config-repair" },
  });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw new Error(`Cannot execute psql: ${result.error.message}`);
  return { status: result.status ?? 1, stdout: result.stdout ?? "" };
}

const lastJsonLine = (stdout: string) => {
  const line = stdout.trim().split("\n").filter(Boolean).at(-1);
  if (!line) throw new Error("The database returned nothing");
  return JSON.parse(line) as unknown;
};

/** The app's own completeness check, when the web app's dependencies are installed. */
async function appCompleteness(): Promise<Completeness | null> {
  try {
    // Loaded by URL so the root typecheck does not follow it into the web app's path aliases. Bun resolves them at run time.
    const source = new URL("../../../apps/web/src/shared/form-response/answer-completeness.ts", import.meta.url).href;
    const module = await import(source) as { formulaAnswerComplete: Completeness };
    return module.formulaAnswerComplete;
  } catch { return null; }
}

export async function run(command: Command): Promise<number> {
  process.stderr.write(`Database: ${command.target.database} on ${command.target.host}:${command.target.port}${command.target.env?.PGUSER ? ` as ${command.target.env.PGUSER}` : ""}\n`);
  if (command.mode === "find") {
    const result = psql(command.target, scriptSql("find", command.target, { atr: command.atr }));
    if (result.status !== 0) return result.status;
    process.stdout.write(`${JSON.stringify(lastJsonLine(result.stdout), null, 2)}\n`);
    return 0;
  }
  const recipe = loadRecipe(command.recipe);
  const loaded = psql(command.target, scriptSql("load", command.target, { question: recipe.questionId }));
  if (loaded.status !== 0) return loaded.status;
  const plan = buildPlan(lastJsonLine(loaded.stdout) as Loaded, recipe, command.allowClosedResponses, await appCompleteness());
  process.stdout.write(`${JSON.stringify({ mode: command.apply ? "apply" : "preview", problems: plan.problems, ...plan.report }, null, 2)}\n`);
  if (plan.problems.length > 0) { process.stderr.write("Refusing to apply: fix the problems above.\n"); return 2; }
  if (!command.apply) { process.stdout.write("Preview only. Nothing was written. Add --apply to write.\n"); return 0; }
  const applied = psql(command.target, scriptSql("repair", command.target, repairSettings(recipe, plan, command.actor, command.reason, command.allowClosedResponses)));
  return applied.status;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await run(parseCommand(process.argv.slice(2))); }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Repair failed"}\n`);
    process.exitCode = 1;
  }
}
