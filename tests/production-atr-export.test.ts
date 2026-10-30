import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { exportCommand } from "../scripts/repairs/production-atr/export.ts";

const identity = "10000000-0000-0000-0000-000000000001";
const connection = ["--host", "production-db", "--port", "5432", "--database", "production_oryx", "--activity", identity];
const repair = ["repair", ...connection, "--step", identity, "--product", identity, "--batch", "4862",
  "--ard", identity, "--stage", "finished", "--actor", identity, "--expected-assignments", "11",
  "--reason", "Restore missing Finished ATR configuration"];

test("SQL export packages independent read-only inspection/preview and explicit apply without connecting", (t) => {
  const root = mkdtempSync(join(tmpdir(), "oryx-atr-export-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const output = join(root, "bundle");
  const paths = exportCommand([output, ...repair]);
  assert.deepEqual(paths, ["inspect.sql", "preview.sql", "apply.sql"].map((name) => join(output, name)));
  assert.equal(statSync(output).mode & 0o777, 0o700);
  for (const path of paths) {
    assert.equal(statSync(path).mode & 0o777, 0o600);
    const sql = readFileSync(path, "utf8");
    assert.match(sql, /\\set ON_ERROR_STOP on/);
    assert.match(sql, /SET oryx_repair.database TO 'production_oryx'/);
    assert.match(sql, /Wrong database/);
    assert.doesNotMatch(sql, /readFileSync|import |PGPASSWORD|164\.90\.142\.68|COMMIT;.*COMMIT;/s);
  }
  assert.match(readFileSync(join(output, "inspect.sql"), "utf8"), /REPEATABLE READ READ ONLY/);
  const preview = readFileSync(join(output, "preview.sql"), "utf8");
  const apply = readFileSync(join(output, "apply.sql"), "utf8");
  assert.match(preview, /SET oryx_repair.apply TO 'false'/);
  assert.match(preview, /REPEATABLE READ READ ONLY/);
  assert.match(apply, /SET oryx_repair.apply TO 'true'/);
  assert.doesNotMatch(apply, /REPEATABLE READ READ ONLY/);
  assert.match(apply, /INSERT INTO public\."_ProductionAtrRepairs"/);
});

test("export can package inspection first without selecting a repair or requesting credentials", (t) => {
  const root = mkdtempSync(join(tmpdir(), "oryx-atr-inspect-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.equal(exportCommand([join(root, "bundle"), "inspect", ...connection]).length, 1);
});

test("export refuses overwrite and --apply so a reviewed bundle cannot silently change", (t) => {
  const root = mkdtempSync(join(tmpdir(), "oryx-atr-existing-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "apply.sql"), "reviewed original");
  assert.throws(() => exportCommand([root, ...repair]));
  assert.equal(readFileSync(join(root, "apply.sql"), "utf8"), "reviewed original");
  assert.throws(() => exportCommand([join(root, "new"), ...repair, "--apply"]), /Do not pass --apply/);
  assert.throws(() => exportCommand([]), /Usage:/);
});
