import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { parseCommand, psqlArguments } from "../scripts/repairs/migration-reservations/index.ts";

const migration = "00000000-0000-4000-8000-000000000004";
const args = ["--host", "localhost", "--database", "fixture", "--migration", migration, "--actor-email", "warehouse@example.test"];
test("repair requires exact target/operator/migration and a reviewed token before apply", () => {
  assert.equal(parseCommand(args, {}).apply, false);
  assert.throws(() => parseCommand([...args, "--apply"], {}));
  assert.throws(() => parseCommand([...args, "--apply", "--expected-token", "bad"], {}));
  assert.throws(() => parseCommand([...args, "--apply", "--apply"], {}));
  assert.throws(() => parseCommand([...args, "--force"], {}));
  assert.throws(() => parseCommand(args, { DATABASE_URL: "postgres://localhost/another" }));
  const command = parseCommand([...args, "--reason", "A quoted ' reason; still one argument"], {});
  assert.ok(psqlArguments(command).includes("reason=A quoted ' reason; still one argument"));
});

const connection = process.env.ORYX_RESERVATION_REPAIR_TEST_CONNECTION;
test("PostgreSQL bulk repair, preview, stale/shortage/authorization gates, rollback, replay and audit", { skip: !connection }, async t => {
  if (!connection) return;
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Repair tests require disposable local PostgreSQL");
  const database = `oryx_reservation_repair_test_${randomUUID().replaceAll("-", "")}`;
  const environment: NodeJS.ProcessEnv = { ...process.env };
  if (url.username) environment.PGUSER = decodeURIComponent(url.username);
  if (url.password) environment.PGPASSWORD = decodeURIComponent(url.password);
  const base = ["-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1", "-h", url.hostname, "-p", url.port || "5432"];
  function sql(source: string, db = database) {
    const result = spawnSync("psql", [...base, "-d", db], { input: source, encoding: "utf8", env: environment });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }
  sql(`CREATE DATABASE "${database}"`, decodeURIComponent(url.pathname.slice(1)) || "postgres");
  const fixture = readFileSync(new URL("fixtures/migration-reservations.sql", import.meta.url), "utf8");
  const source = readFileSync(new URL("../scripts/repairs/migration-reservations/repair.sql", import.meta.url), "utf8");
  function reset() { sql(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; ${fixture}`); }
  function execute(apply = false, token = "", expectedDatabase = database) {
    return spawnSync("psql", [...base, "-d", database, "-v", `expected_database=${expectedDatabase}`,
      "-v", `migration_id=${migration}`, "-v", "actor_email=warehouse@example.test", "-v", `apply=${apply}`, "-v", `expected_token=${token}`],
    { input: source, encoding: "utf8", env: environment, maxBuffer: 8 * 1024 * 1024 });
  }
  const reportSchema = z.object({ previewToken: z.string(), requisitions: z.array(z.object({ id: z.string() })), bindings: z.array(z.object({ reservation_id: z.string() })), problems: z.array(z.string()) });
  function preview() {
    const result = execute(); assert.equal(result.status, 0, result.stderr);
    const line = result.stdout.split("\n").find(value => value.startsWith("{"));
    return reportSchema.parse(JSON.parse(line ?? "{}"));
  }
  try {
    await t.test("covers every waiting requisition, retains issued history and physical quantities, and writes immutable audit", () => {
      reset(); const report = preview();
      assert.equal(report.requisitions.length, 2); assert.equal(report.bindings.length, 2); assert.deepEqual(report.problems, []);
      assert.equal(sql('SELECT count(*) FROM "MaterialBatchReservedQuantities" WHERE "MaterialBatchId"=\'00000000-0000-4000-8000-000000000007\''), "0");
      assert.equal(sql("SELECT to_regclass('public.\"_MigrationReservationRepairs\"') IS NULL"), "t");
      const applied = execute(true, report.previewToken); assert.equal(applied.status, 0, applied.stderr);
      assert.equal(sql('SELECT count(*) FROM "MaterialBatchReservedQuantities" WHERE "MaterialBatchId"=\'00000000-0000-4000-8000-000000000007\''), "2");
      assert.equal(sql('SELECT "MaterialBatchId" FROM "MaterialBatchReservedQuantities" WHERE "Id"=\'00000000-0000-4000-8000-000000000062\''), "00000000-0000-4000-8000-000000000006");
      assert.equal(sql('SELECT sum("Quantity") FROM "ShelfMaterialBatches"'), "1000");
      assert.equal(sql('SELECT count(*) FROM "StockRequisitionIssues"'), "1");
      assert.equal(sql('SELECT count(*) FROM "_MigrationReservationRepairs"'), "1");
      assert.notEqual(execute(true, report.previewToken).status, 0);
      assert.equal(sql('SELECT count(*) FROM "_MigrationReservationRepairs"'), "1");
      const tamper = spawnSync("psql", [...base, "-d", database, "-c", 'DELETE FROM "_MigrationReservationRepairs"'], { encoding: "utf8", env: environment });
      assert.notEqual(tamper.status, 0); assert.match(tamper.stderr, /immutable/);
    });
    await t.test("refuses stale previews, including a newly queued requisition", () => {
      reset(); const report = preview();
      sql('UPDATE "Requisitions" SET "UpdatedAt"=now() WHERE "Status"=1');
      const applied = execute(true, report.previewToken); assert.notEqual(applied.status, 0); assert.match(applied.stderr, /Preview changed/);
      reset(); const original = preview();
      sql('UPDATE "Requisitions" SET "Status"=1 WHERE "Status"=3; DELETE FROM "StockRequisitionIssues"; UPDATE "RequisitionItems" SET "Status"=1');
      assert.equal(preview().bindings.length, 3); assert.notEqual(execute(true, original.previewToken).status, 0);
    });
    const cases = [
      ['UPDATE "ShelfMaterialBatches" SET "Quantity"=15; UPDATE "BinCardInformation" SET "QuantityReceived"=15', /insufficient/],
      ['DELETE FROM "PermissionTypes"', /Operator lacks/],
      ['UPDATE "RequisitionItems" SET "Quantity"=11 WHERE "Status"=1', /approved line/],
      ['INSERT INTO "StockRequisitionIssues" VALUES (\'00000000-0000-4000-8000-000000000040\')', /issue evidence/],
      ['UPDATE "MaterialBatches" SET "ExpiryDate"=now()-interval \'1 day\', "RetestDate"=now()+interval \'30 days\' WHERE "Status"=3', /eligible replacement/],
      ['UPDATE "ShelfMaterialBatches" SET "Quantity"=999', /bin-card/],
      ['INSERT INTO "ShelfMaterialBatches" SELECT \'00000000-0000-4000-8000-000000000099\',"MaterialBatchId","WarehouseLocationShelfId","UoMId","Quantity","DeletedAt" FROM "ShelfMaterialBatches"', /expected one eligible/],
      ['UPDATE "MaterialBatches" SET "Status"=6 WHERE "Status"=3', /eligible replacement/],
      ['UPDATE "Requisitions" SET "Approved"=false WHERE "Status"=1', /approval/],
      ["INSERT INTO \"Operations\" VALUES ('00000000-0000-4000-8000-000000000098','Final Packing'); INSERT INTO \"ProductionActivitySteps\" (\"ProductionActivityId\",\"OperationId\",\"StartedAt\") VALUES ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000098',now())", /consumption step/],
    ] as const;
    for (const [mutation, problem] of cases) await t.test(`blocks ${problem}`, () => {
      reset(); sql(mutation); const report = preview(); assert.ok(report.problems.some(value => problem.test(value)));
      assert.notEqual(execute(true, report.previewToken).status, 0);
      assert.equal(sql('SELECT count(*) FROM "MaterialBatchReservedQuantities" WHERE "MaterialBatchId"=\'00000000-0000-4000-8000-000000000007\''), "0");
    });
    await t.test("database failures roll back all reservations and audit, and wrong database is refused", () => {
      reset(); const report = preview();
      sql(`CREATE FUNCTION refuse_second() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."Id"='00000000-0000-4000-8000-000000000061' THEN RAISE EXCEPTION 'synthetic refusal'; END IF; RETURN NEW; END $$;
        CREATE TRIGGER refuse_second BEFORE UPDATE ON "MaterialBatchReservedQuantities" FOR EACH ROW EXECUTE FUNCTION refuse_second();`);
      assert.notEqual(execute(true, report.previewToken).status, 0);
      assert.equal(sql('SELECT count(*) FROM "MaterialBatchReservedQuantities" WHERE "MaterialBatchId"=\'00000000-0000-4000-8000-000000000007\''), "0");
      assert.notEqual(execute(false, "", "wrong_database").status, 0);
    });
    await t.test("operator department must match and raw stock keeps its retest validity rule", () => {
      reset(); sql('UPDATE users SET "DepartmentId"=NULL');
      const denied = execute(); assert.notEqual(denied.status, 0); assert.match(denied.stderr, /active operator in its department/);
      reset();
      sql(`UPDATE "Materials" SET "Kind"=0; UPDATE "Warehouses" SET "Type"=0 WHERE "Type"=1;
        UPDATE roleclaims SET "ClaimValue"='CanIssueRawMaterialRequisitions'; UPDATE "PermissionTypes" SET "Key"='CanIssueRawMaterialRequisitions';
        UPDATE "MaterialBatches" SET "ExpiryDate"=now()-interval '1 day',"RetestDate"=now()+interval '30 days' WHERE "Status"=3;`);
      const report = preview(); assert.deepEqual(report.problems, []); assert.equal(execute(true, report.previewToken).status, 0);
    });
    await t.test("concurrent apply can commit only once", async () => {
      reset(); const report = preview();
      function applyAsync(): Promise<number | null> {
        return new Promise((resolve, reject) => {
          const child = spawn("psql", [...base, "-d", database, "-v", `expected_database=${database}`, "-v", `migration_id=${migration}`,
            "-v", "actor_email=warehouse@example.test", "-v", "apply=true", "-v", `expected_token=${report.previewToken}`], { env: environment, stdio: ["pipe", "ignore", "ignore"] });
          child.on("error", reject); child.on("close", resolve); child.stdin.end(source);
        });
      }
      const results = await Promise.all([applyAsync(), applyAsync()]);
      assert.equal(results.filter(value => value === 0).length, 1);
      assert.equal(sql('SELECT count(*) FROM "_MigrationReservationRepairs"'), "1");
    });
  } finally { sql(`DROP DATABASE "${database}" WITH (FORCE)`, decodeURIComponent(url.pathname.slice(1)) || "postgres"); }
});
