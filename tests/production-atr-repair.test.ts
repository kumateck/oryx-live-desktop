import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { parseCommand, type AtrRepair } from "../scripts/repairs/production-atr/options.ts";
import { repairSql } from "../scripts/repairs/production-atr/index.ts";
import { ids, resetSql, schemaSql, dropSql } from "./fixtures/production-atr.ts";

const args = ["repair", "--host", "localhost", "--database", "oryx_atr_test_fixture", "--activity", ids.activity,
  "--step", ids.step, "--product", ids.product, "--batch", "4862", "--ard", ids.ard, "--stage", "bulk",
  "--actor", ids.actor, "--reason", "Restore missing ATR configuration", "--expected-assignments", "1"];
const parsed = parseCommand(args);
if (parsed.mode !== "repair") throw new Error("Invalid fixture");
const target = parsed.target;

test("repair defaults to read-only preview and requires exact identities and stage", () => {
  assert.equal(target.apply, false);
  assert.equal(target.repairProcedure, false);
  assert.match(repairSql(parsed), /REPEATABLE READ READ ONLY/);
  assert.equal(parseCommand([...args, "--apply"]).mode, "repair");
  for (const flag of ["--step", "--product", "--batch", "--ard", "--actor", "--stage", "--reason", "--expected-assignments", "--database", "--host"]) {
    const index = args.indexOf(flag);
    assert.throws(() => parseCommand([...args.slice(0, index), ...args.slice(index + 2)]));
  }
  assert.throws(() => parseCommand([...args, "--apply", "--apply"]));
  assert.throws(() => parseCommand([...args, "--force"]));
  const changed = (key: string, value: string) => args.map((item, index) => args[index - 1] === key ? value : item);
  for (const [key, value] of [["--database", "postgresql://wrong/db"], ["--database", "host=wrong"], ["--host", "-h"],
    ["--stage", "10"], ["--expected-assignments", "0"], ["--actor", "bad-id"]]) {
    assert.ok(key && value);
    assert.throws(() => parseCommand(changed(key, value)));
  }
});

const database = process.env.ORYX_REPAIR_TEST_DATABASE;
const host = process.env.ORYX_REPAIR_TEST_HOST;
const port = process.env.ORYX_REPAIR_TEST_PORT ?? "5432";
test("PostgreSQL: preview, audited repair, idempotency and refusal paths", { skip: !database || !host }, async (t) => {
  if (!database || !host || !/^oryx_atr_test_[a-z0-9_]+$/.test(database)) throw new Error("Use a dedicated oryx_atr_test_* database");
  const sql = (input: string) => spawnSync("psql", ["-X", "-w", "-h", host, "-p", port, "-d", database, "-qAt", "-v", "ON_ERROR_STOP=1"],
    { input, encoding: "utf8", env: { ...process.env, PGCONNECT_TIMEOUT: "5" } });
  const ok = (input: string) => {
    const result = sql(input);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  assert.equal(ok("SELECT current_database();"), database);
  assert.equal(ok("SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"), "0", "Integration database must be empty");
  t.after(() => ok(dropSql));
  ok(schemaSql);
  const run = (overrides: Partial<AtrRepair> = {}) => sql(repairSql({ mode: "repair", target: { ...target, host, port: Number(port), database, ...overrides } }));
  const links = () => ok('SELECT coalesce("ProductAnalyticalRawDataId"::text, \'missing\') FROM "ProductionActivityStepUsers";');
  await t.test("inspection identifies source and ARD without writes", () => {
    ok(resetSql);
    const output = ok(repairSql({ mode: "inspect", target: { ...target, host, database } }));
    assert.match(output, /Coldrilif Syrup/);
    assert.match(output, /4862/);
    assert.match(output, /matchingRoutes/);
    assert.equal(links(), "missing");
  });
  await t.test("dry-run writes no links, timestamps, logs or audit table", () => {
    ok(resetSql);
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /"rowsToChange": 1/);
    assert.equal(links(), "missing");
    assert.equal(ok('SELECT count(*) FROM "ProductionActivityLogs";'), "0");
    assert.equal(ok('SELECT "UpdatedAt" IS NULL FROM "ProductionActivityStepUsers";'), "t");
    assert.equal(ok(`SELECT to_regclass('public."_ProductionAtrRepairs"') IS NULL;`), "t");
  });
  await t.test("apply fills links and records exact before/after without progressing workflow; repeat is a no-op", () => {
    ok(resetSql);
    const workflowBefore = ok('SELECT to_jsonb(s) FROM "ProductionActivitySteps" s;');
    const result = run({ apply: true, reason: "Restore operator's ATR $$ worksheet; keep approvals" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(links(), ids.ard);
    assert.equal(ok('SELECT count(*) FROM "_ProductionAtrRepairs";'), "1");
    assert.equal(ok('SELECT "Plan"->\'before\'->0->\'row\'->>\'ProductAnalyticalRawDataId\' IS NULL FROM "_ProductionAtrRepairs";'), "t");
    assert.equal(ok('SELECT "After"->0->\'row\'->>\'ProductAnalyticalRawDataId\' FROM "_ProductionAtrRepairs";'), ids.ard);
    assert.equal(ok('SELECT to_jsonb(s) FROM "ProductionActivitySteps" s;'), workflowBefore);
    assert.equal(ok('SELECT count(*) FROM "AnalyticalTestRequests";'), "0");
    assert.equal(ok('SELECT count(*) FROM "ProductionActivityLogs";'), "1");
    assert.equal(run({ apply: true }).status, 0);
    assert.equal(ok('SELECT count(*) FROM "_ProductionAtrRepairs";'), "1");
    assert.equal(ok('SELECT count(*) FROM "ProductionActivityLogs";'), "1");
  });
  await t.test("procedure repair must be explicit, covers user/role links and leaves other actions alone", () => {
    ok(resetSql);
    ok('UPDATE "RouteResponsibleUsers" SET "ProductAnalyticalRawDataId" = NULL; UPDATE "RouteResponsibleRoles" SET "ProductAnalyticalRawDataId" = NULL;');
    assert.notEqual(run({ apply: true }).status, 0);
    assert.equal(links(), "missing");
    ok(`INSERT INTO "ProductionActivityStepUsers" ("Id", "ProductionActivityStepId", "UserId", "Action") VALUES ('${ids.actor}', '${ids.step}', '${ids.actor}', 0);`);
    const preview = run({ repairProcedure: true });
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stderr, /"rowsToChange": 3/);
    const result = run({ apply: true, repairProcedure: true });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(ok('SELECT "ProductAnalyticalRawDataId" FROM "RouteResponsibleRoles";'), ids.ard);
    assert.equal(ok('SELECT jsonb_array_length("After") FROM "_ProductionAtrRepairs";'), "3");
    assert.equal(ok('SELECT "ProductAnalyticalRawDataId" IS NULL FROM "ProductionActivityStepUsers" WHERE "Action" = 0;'), "t");
  });
  const refusals: [string, string, Partial<AtrRepair>][] = [
    ["missing ATR instruction", 'UPDATE "ProductionActivityStepUsers" SET "Action" = 0;', {}],
    ["deleted activity", 'UPDATE "ProductionActivities" SET "DeletedAt" = now();', {}],
    ["deleted step", 'UPDATE "ProductionActivitySteps" SET "DeletedAt" = now();', {}],
    ["deleted ARD", 'UPDATE "ProductAnalyticalRawData" SET "DeletedAt" = now();', {}],
    ["missing procedure instructions", 'DELETE FROM "RouteResponsibleUsers"; DELETE FROM "RouteResponsibleRoles";', { repairProcedure: true }],
    ["conflicting activity link", `INSERT INTO "ProductAnalyticalRawData" ("Id", "StpId", "FormId", "Stage") VALUES ('${ids.other}', '${ids.other}', '${ids.other}', 0); UPDATE "ProductionActivityStepUsers" SET "ProductAnalyticalRawDataId" = '${ids.other}';`, {}],
    ["conflicting procedure link", `INSERT INTO "ProductAnalyticalRawData" ("Id", "StpId", "FormId", "Stage") VALUES ('${ids.other}', '${ids.other}', '${ids.other}', 0); UPDATE "RouteResponsibleRoles" SET "ProductAnalyticalRawDataId" = '${ids.other}';`, { repairProcedure: true }],
    ["wrong product", "", { product: ids.other }], ["wrong batch", "", { batch: "4863" }],
    ["wrong stage", "", { stage: 2 }], ["stale assignment count", "", { expectedAssignments: 2 }],
    ["cancelled batch", 'UPDATE "ProductionScheduleProducts" SET "Cancelled" = true;', {}],
    ["completed step", 'UPDATE "ProductionActivitySteps" SET "CompletedAt" = now();', {}],
    ["completed activity", 'UPDATE "ProductionActivities" SET "Status" = 2;', {}],
    ["disabled actor", 'UPDATE users SET "IsDisabled" = true;', {}],
    ["wrong department", 'UPDATE users SET "DepartmentId" = NULL;', {}],
    ["missing permission", 'DELETE FROM "PermissionTypes";', {}],
    ["deleted role", 'UPDATE roles SET "DeletedAt" = now();', {}],
    ["unverified ARD", 'UPDATE "ProductAnalyticalRawData" SET "IsVerified" = false;', {}],
    ["deleted form", 'UPDATE "Forms" SET "DeletedAt" = now();', {}],
    ["deleted STP", 'UPDATE "ProductStandardTestProcedures" SET "DeletedAt" = now();', {}],
    ["missing BMR", 'DELETE FROM "BatchManufacturingRecords";', {}],
    ["existing deleted ATR", `INSERT INTO "AnalyticalTestRequests" ("Id", "ProductionActivityStepId", "ProductionScheduleProductId", "Stage", "DeletedAt") VALUES ('${ids.other}', '${ids.step}', '${ids.batch}', 1, now());`, {}],
    ["ambiguous route", `INSERT INTO "Routes" ("Id", "ProductId", "OperationId", "Order") VALUES ('${ids.other}', '${ids.product}', '${ids.other}', 10);`, {}],
    ["ambiguous chemical ARD", `INSERT INTO "ProductAnalyticalRawData" ("Id", "StpId", "FormId", "Stage") VALUES ('${ids.other}', '${ids.other}', '${ids.other}', 1);`, {}],
    ["missing microbial ARD", `UPDATE "ProductAnalyticalRawData" SET "Stage" = 2; INSERT INTO "MicrobialRequirements" ("Id", "ProductId", "Stage") VALUES ('${ids.other}', '${ids.product}', 2);`, { stage: 2 }],
  ];
  for (const [name, setup, overrides] of refusals) await t.test(name, () => {
    ok(resetSql); if (setup) ok(setup);
    const linksBefore = links();
    const result = run({ apply: true, ...overrides });
    assert.notEqual(result.status, 0, `Should refuse ${name}: ${result.stderr}`);
    assert.equal(links(), linksBefore);
    assert.equal(ok('SELECT count(*) FROM "ProductionActivityLogs";'), "0");
    assert.equal(ok('SELECT count(*) FROM "_ProductionAtrRepairs";'), "0");
  });
  await t.test("intermediate stage zero is preserved", () => {
    ok(resetSql); ok('UPDATE "ProductAnalyticalRawData" SET "Stage" = 0;');
    const result = run({ apply: true, stage: 0 });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /"stage": 0/);
  });
  await t.test("finished stage accepts the required separate verified microbial worksheet", () => {
    ok(resetSql);
    ok(`UPDATE "ProductAnalyticalRawData" SET "Stage" = 2;
      INSERT INTO "Forms" ("Id") VALUES ('${ids.ard}');
      INSERT INTO "ProductAnalyticalRawData" ("Id", "StpId", "FormId", "Stage", "AnalysisType") VALUES ('${ids.other}', '${ids.other}', '${ids.ard}', 2, 1);
      INSERT INTO "MicrobialRequirements" ("Id", "ProductId", "Stage") VALUES ('${ids.other}', '${ids.product}', 2);`);
    const result = run({ apply: true, stage: 2 });
    assert.equal(result.status, 0, result.stderr);
  });
  await t.test("an ATR committed while waiting for locks is seen before the repair", async () => {
    ok(resetSql);
    const writer = spawn("psql", ["-X", "-w", "-h", host, "-p", port, "-d", database, "-qAt", "-v", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    const completed = new Promise<number | null>((resolve, reject) => { writer.on("exit", resolve); writer.on("error", reject); });
    const ready = new Promise<void>((resolve, reject) => {
      writer.stdout.on("data", (data: Buffer) => { if (data.toString().includes("LOCKED")) resolve(); });
      writer.on("exit", () => reject(new Error("Writer exited before taking its lock")));
      writer.on("error", reject);
    });
    writer.stdin.end(`BEGIN; LOCK TABLE "AnalyticalTestRequests" IN ROW EXCLUSIVE MODE;
      SELECT 'LOCKED'; SELECT pg_sleep(0.5);
      INSERT INTO "AnalyticalTestRequests" ("Id", "ProductionActivityStepId", "ProductionScheduleProductId", "Stage") VALUES ('${ids.other}', '${ids.step}', '${ids.batch}', 1); COMMIT;`);
    await ready;
    const result = run({ apply: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /An ATR already exists/);
    assert.equal(await completed, 0);
    assert.equal(links(), "missing");
  });
  await t.test("audit failure rolls the data changes back", () => {
    ok(resetSql);
    ok('UPDATE "RouteResponsibleUsers" SET "ProductAnalyticalRawDataId" = NULL;');
    ok('ALTER TABLE "ProductionActivityLogs" ADD CONSTRAINT reject_repair CHECK (false) NOT VALID;');
    const result = run({ apply: true, repairProcedure: true });
    assert.notEqual(result.status, 0);
    assert.equal(links(), "missing");
    assert.equal(ok('SELECT count(*) FROM "_ProductionAtrRepairs";'), "0");
    assert.equal(ok('SELECT "ProductAnalyticalRawDataId" IS NULL FROM "RouteResponsibleUsers";'), "t");
    ok('ALTER TABLE "ProductionActivityLogs" DROP CONSTRAINT reject_repair;');
  });
});
