import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { definitionPayload, patchAnswer, patchDefinition, sha256 } from "../scripts/repairs/formula-config/definition.ts";
import { parseCommand as parseWith, targetFromUrl } from "../scripts/repairs/formula-config/options.ts";

const parseCommand = (args: readonly string[]) => parseWith(args, {});
import { parseRecipe, type Recipe } from "../scripts/repairs/formula-config/recipe.ts";
import { buildPlan, type Loaded } from "../scripts/repairs/formula-config/plan.ts";
import { repairSettings, scriptSql } from "../scripts/repairs/formula-config/index.ts";
import { formulaIds as ids, formulaSchemaSql, formulaSeedSql, formulaDropSql, uniformityDefinition } from "./fixtures/formula-config.ts";

const connection = ["--host", "localhost", "--database", "oryx_formula_test_fixture"];

test("commands default to preview and refuse loose or unsafe options", () => {
  const find = parseCommand(["find", ...connection, "--atr", ids.atr]);
  assert.equal(find.mode, "find");
  const args = ["repair", ...connection, "--recipe", "case.json", "--actor", ids.actor, "--reason", "Fix the tube count on ATR"];
  const repair = parseCommand(args);
  assert.ok(repair.mode === "repair" && !repair.apply && !repair.allowClosedResponses);
  assert.ok(parseCommand([...args, "--apply"]).mode === "repair");
  for (const bad of [[...args, "--apply", "--apply"], [...args, "--force"], ["find", ...connection, "--atr", ids.atr, "--apply"],
    ["repair", ...connection, "--recipe", "case.json", "--actor", ids.actor, "--reason", "short"],
    ["repair", ...connection, "--recipe", "case.txt", "--actor", ids.actor, "--reason", "Fix the tube count on ATR"],
    ["find", "--host", "localhost", "--database", "host=other", "--atr", ids.atr],
    ["find", "--host", "localhost", "--database", "postgresql://x/y", "--atr", ids.atr], ["inspect", ...connection]]) {
    assert.throws(() => parseCommand(bad), Error, bad.join(" "));
  }
});

test("DATABASE_URL from .env supplies the target; credentials stay out of arguments and messages", () => {
  const url = "postgresql://oryx:s3cr%40t@164.90.142.68:5433/oryx_live?sslmode=require";
  assert.deepEqual(targetFromUrl(url), { host: "164.90.142.68", port: 5433, database: "oryx_live",
    env: { PGUSER: "oryx", PGPASSWORD: "s3cr@t", PGSSLMODE: "require" } });
  const find = parseWith(["find", "--atr", ids.atr], { DATABASE_URL: url });
  assert.equal(find.target.database, "oryx_live");
  assert.equal(find.target.env?.PGPASSWORD, "s3cr@t");
  assert.equal(parseWith(["find", "--database", "oryx_live", "--atr", ids.atr], { DATABASE_URL: url }).target.port, 5433);
  assert.throws(() => parseWith(["find", "--database", "other_db", "--atr", ids.atr], { DATABASE_URL: url }), /disagree/);
  assert.throws(() => parseWith(["find", "--atr", ids.atr], {}), /--host is required/);
  for (const bad of ["mysql://u:p@h/db", "postgresql://u:p@h/", "postgresql://u:p@h/db?host=/tmp", "postgresql://u:p@h/db?sslmode=yes", "not a url"]) {
    assert.throws(() => targetFromUrl(bad), (error: Error) => !error.message.includes(":p@") && !error.message.includes("u:p"), bad);
  }
});

const recipe = (over: Partial<Recipe> = {}): Recipe => ({ name: "Uniformity count", note: "Tube count is zero on this test.", questionId: ids.uniformityQuestion,
  expectedDefinitionSha256: sha256(uniformityDefinition), definition: [{ op: "set", path: ["sampleCount"], value: 20 }], answers: null, ...over });

test("recipes must be complete, and every shipped recipe is", () => {
  assert.equal(parseRecipe(JSON.stringify(recipe())).questionId, ids.uniformityQuestion);
  const dir = new URL("../scripts/repairs/formula-config/recipes/", import.meta.url);
  for (const file of readdirSync(dir)) assert.ok(parseRecipe(readFileSync(new URL(file, dir), "utf8")).name, file);
  assert.throws(() => parseRecipe(JSON.stringify({ ...recipe(), questionId: "REPLACE-WITH-QUESTION-ID-FROM-FIND" })), /questionId/);
  for (const bad of [{ ...recipe(), extra: 1 }, { ...recipe(), expectedDefinitionSha256: "abc" },
    { ...recipe(), definition: [{ op: "set", path: ["__proto__"], value: 1 }] }, { ...recipe(), definition: [] },
    { ...recipe(), definition: [{ op: "eval", path: ["x"] }] }]) {
    assert.throws(() => parseRecipe(JSON.stringify(bad)));
  }
});

test("definition patches keep every layer of string wrapping", () => {
  const payload = { type: 3, mode: "tube", sampleCount: 0, nominal: null };
  for (const raw of [JSON.stringify(payload), JSON.stringify(JSON.stringify(payload)), JSON.stringify({ settings: JSON.stringify(payload), label: "x" })]) {
    const patched = patchDefinition(raw, [{ op: "set", path: ["sampleCount"], value: 20 }, { op: "set", path: ["decimalPlaces"], value: 2 }]);
    assert.equal(definitionPayload(patched).sampleCount, 20);
    assert.equal(definitionPayload(patched).decimalPlaces, 2);
    assert.equal(patched.startsWith('"'), raw.startsWith('"'));
    assert.equal(typeof JSON.parse(patched).settings, typeof JSON.parse(raw).settings);
  }
});

test("variables are renamed as whole tokens, including manual variable keys", () => {
  const raw = JSON.stringify({ expression: "(:avgsample/:avgstd)*(:stdconc/:splconc)*:stdconcX", manualVars: { stdconc: 1 },
    namedExpressions: [{ name: "a", expression: ":stdconc+1" }] });
  const payload = definitionPayload(patchDefinition(raw, [{ op: "renameVariable", from: "stdconc", to: "standardAvg" }]));
  assert.equal(payload.expression, "(:avgsample/:avgstd)*(:standardAvg/:splconc)*:stdconcX");
  assert.deepEqual(payload.manualVars, { standardAvg: 1 });
  assert.deepEqual(payload.namedExpressions, [{ name: "a", expression: ":standardAvg+1" }]);
  assert.throws(() => patchDefinition(raw, [{ op: "renameVariable", from: "missing", to: "x" }]), /not found/);
  assert.throws(() => patchDefinition(raw, [{ op: "remove", path: ["expression"] }]), /lost their expression/);
  const wrapped = JSON.stringify(JSON.stringify({ type: 3, mode: "tube", sampleCount: 0 }));
  const replaced = patchDefinition(wrapped, [{ op: "replace", value: { type: 3, mode: "tube", sampleCount: 10, decimalPlaces: 2, nominal: 20 } }]);
  assert.deepEqual(definitionPayload(replaced), { type: 3, mode: "tube", sampleCount: 10, decimalPlaces: 2, nominal: 20 });
  assert.ok(replaced.startsWith('"'), "replace keeps the string wrapping");
  assert.throws(() => patchDefinition(wrapped, [{ op: "replace", value: { sampleCount: 10 } }]), /lost their expression/);
  assert.throws(() => parseRecipe(JSON.stringify({ ...recipe(), definition: [{ op: "replace", value: [1] }] })), /whole settings object/);
  assert.equal(JSON.parse(patchAnswer(JSON.stringify({ inputs: { indWts: ["1"] } }), [{ op: "padArray", path: ["inputs", "indWts"], length: 3, fill: "" }])).inputs.indWts.length, 3);
});

// The layout found on ATR 01a1886d: settings stored as a JSON string inside "expression".
const nestedUniformity = JSON.stringify({ type: 2, expression: JSON.stringify({ type: 2, mode: "tablet", percent: false, decimalPlaces: 2, sampleCount: 10, nominal: null }) });
const nestedDissolution = JSON.stringify({ type: 3, expression: JSON.stringify({ expression: "((:avgsamplepeakarea/:avgstandardpeakarea)*(:stdconc/ :splconc))*:purity", type: 3,
  manualVars: {}, manualVarLabels: { avgsamplepeakarea: "a", stdconc: "standard concentration", splconc: "sample concentration", purity: "p" }, headers: ["Standard", "Sample 1"] }) });

test("old nested layouts: edits reach the inner settings, and replace can flatten them", () => {
  assert.equal(definitionPayload(nestedUniformity).sampleCount, 10);
  const flat = patchDefinition(nestedUniformity, [{ op: "replace", value: { type: 2, mode: "tablet", percent: false, decimalPlaces: 2, sampleCount: 10, nominal: 20 } }]);
  assert.deepEqual(JSON.parse(flat), { type: 2, mode: "tablet", percent: false, decimalPlaces: 2, sampleCount: 10, nominal: 20 });
  const kept = patchDefinition(nestedUniformity, [{ op: "set", path: ["nominal"], value: 20 }]);
  assert.equal(typeof JSON.parse(kept).expression, "string", "targeted edits keep the nested layout");
  assert.equal(JSON.parse(JSON.parse(kept).expression).nominal, 20);
  const dissolution = patchDefinition(nestedDissolution, [{ op: "remove", path: ["manualVarLabels", "stdconc"] }, { op: "remove", path: ["manualVarLabels", "splconc"] },
    { op: "renameVariable", from: "stdconc", to: "standardAvg" }, { op: "renameVariable", from: "splconc", to: "sampleAvg" }]);
  const inner = definitionPayload(dissolution);
  assert.equal(inner.expression, "((:avgsamplepeakarea/:avgstandardpeakarea)*(:standardAvg/ :sampleAvg))*:purity");
  assert.deepEqual(inner.manualVarLabels, { avgsamplepeakarea: "a", purity: "p" });
  assert.deepEqual(Object.keys(JSON.parse(dissolution)), ["type", "expression"]);
});

const loaded = (over: Partial<Loaded> = {}): Loaded => ({
  question: { id: ids.uniformityQuestion, label: "Uniformity", type: 10, deletedAt: null, governed: false },
  options: [{ id: ids.uniformityOption, definition: uniformityDefinition }], fields: [{ id: ids.uniformityField, formId: ids.form, formName: "ARD" }],
  responses: [{ id: ids.openResponse, formId: ids.form, checkedAt: null, approved: false, rejected: false, deletedAt: null, submissionSets: 0, snapshots: 0,
    governedPlacement: false, answers: [{ id: ids.openAnswer, formFieldId: ids.uniformityField, createdAt: "2026-10-01T00:00:00Z", value: '{"inputs":{"bulkTotal":"321","indWts":[]}}' }] }],
  ...over,
});

test("plans refuse changed, governed or closed definitions and report the app's completeness before and after", () => {
  const plan = buildPlan(loaded(), recipe(), false, (_raw, definition) => definitionPayload(definition).sampleCount !== 0);
  assert.deepEqual(plan.problems, []);
  assert.deepEqual(plan.report.openAnswers, [{ responseId: ids.openResponse, answerId: ids.openAnswer, formFieldId: ids.uniformityField, completeBefore: false, completeAfter: true }]);
  assert.match(buildPlan(loaded(), recipe({ expectedDefinitionSha256: "0".repeat(64) }), false, null).problems.join(), /hash/);
  assert.match(buildPlan(loaded({ question: { ...loaded().question!, governed: true } }), recipe(), false, null).problems.join(), /governance/);
  const closed = loaded({ responses: [{ ...loaded().responses[0]!, checkedAt: "2026-10-02T00:00:00Z" }] });
  assert.match(buildPlan(closed, recipe(), false, null).problems.join(), /Closed responses/);
  assert.deepEqual(buildPlan(closed, recipe(), true, null).problems, []);
  assert.match(buildPlan(closed, recipe({ answers: { responseIds: [ids.openResponse], operations: [{ op: "set", path: ["x"], value: 1 }] } }), true, null).problems.join(), /not open/);
  const answered = buildPlan(loaded(), recipe({ answers: { responseIds: [ids.openResponse], operations: [{ op: "padArray", path: ["inputs", "indWts"], length: 20, fill: "" }] } }), false, null);
  assert.equal(answered.answers.length, 1);
  assert.equal(JSON.parse(answered.answers[0]!.value).inputs.indWts.length, 20);
});

test("find and load run read-only; only repair writes, with the database guard and escaped values", () => {
  const target = { host: "localhost", port: 5432, database: "oryx_formula_test_fixture" };
  assert.match(scriptSql("find", target, { atr: ids.atr }), /READ ONLY/);
  assert.match(scriptSql("load", target, { question: ids.uniformityQuestion }), /READ ONLY/);
  const plan = buildPlan(loaded(), recipe(), false, null);
  const sql = scriptSql("repair", target, repairSettings(recipe(), plan, ids.actor, "It's broken", false));
  assert.doesNotMatch(sql, /READ ONLY/);
  assert.match(sql, /Wrong database/);
  assert.match(sql, /'It''s broken'/);
});

const database = process.env.ORYX_REPAIR_TEST_DATABASE;
const host = process.env.ORYX_REPAIR_TEST_HOST;
const port = process.env.ORYX_REPAIR_TEST_PORT ?? "5432";
test("PostgreSQL: find, preview, audited repair and refusal paths", { skip: !database || !host }, async (t) => {
  if (!database || !host || !/^oryx_formula_test_[a-z0-9_]+$/.test(database)) throw new Error("Use a dedicated oryx_formula_test_* database");
  const target = { host, port: Number(port), database };
  const sql = (input: string) => spawnSync("psql", ["-X", "-w", "-h", host, "-p", port, "-d", database, "-qAt", "-v", "ON_ERROR_STOP=1"],
    { input, encoding: "utf8", env: { ...process.env, PGCONNECT_TIMEOUT: "5" } });
  const ok = (input: string) => { const result = sql(input); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); };
  assert.equal(ok("SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"), "0", "Integration database must be empty");
  t.after(() => ok(formulaDropSql));
  ok(formulaSchemaSql);
  const lastJson = (output: string) => JSON.parse(output.split("\n").filter(Boolean).at(-1)!);
  const definition = () => ok(`SELECT "Name" FROM "QuestionOptions" WHERE "Id" = '${ids.uniformityOption}';`);
  const apply = (plan: ReturnType<typeof buildPlan>, over: Partial<Recipe> = {}, allowClosed = false) =>
    sql(scriptSql("repair", target, repairSettings(recipe(over), plan, ids.actor, "Fix the tube count on this ATR", allowClosed)));
  const freshPlan = (over: Partial<Recipe> = {}, allowClosed = false) =>
    buildPlan(lastJson(ok(scriptSql("load", target, { question: ids.uniformityQuestion }))) as Loaded, recipe(over), allowClosed, null);

  await t.test("find lists the ATR's formula questions and answers without writing", () => {
    ok(formulaSeedSql);
    const found = lastJson(ok(scriptSql("find", target, { atr: ids.atr })));
    const fields = found.forms[0].formulaFields;
    assert.equal(fields.length, 1);
    assert.equal(fields[0].options[0].sha256, sha256(uniformityDefinition));
    assert.equal(found.responses[0].formulaAnswers.length, 1);
  });

  await t.test("repair rewrites the definition and answers once, with an audit row", () => {
    ok(formulaSeedSql);
    const over = { answers: { responseIds: [ids.openResponse], operations: [{ op: "padArray" as const, path: ["inputs", "indWts"], length: 20, fill: "" }] } };
    const plan = freshPlan(over);
    assert.deepEqual(plan.problems, []);
    const result = apply(plan, over);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(definitionPayload(definition()).sampleCount, 20);
    assert.equal(JSON.parse(ok(`SELECT "Value" FROM "FormResponses" WHERE "Id" = '${ids.openAnswer}';`)).inputs.indWts.length, 20);
    assert.equal(ok('SELECT count(*) FROM "_FormulaConfigRepairs";'), "1");
    const again = apply(plan, over);
    assert.notEqual(again.status, 0);
    assert.match(again.stderr, /changed since the recipe/);
  });

  await t.test("repair refuses closed responses, governed questions and unauthorized actors", () => {
    ok(formulaSeedSql);
    ok(`UPDATE "Responses" SET "CheckedAt" = now() WHERE "Id" = '${ids.openResponse}';`);
    const closed = apply(freshPlan({}, true));
    assert.match(closed.stderr, /Closed responses/);
    assert.equal(definition(), uniformityDefinition);
    assert.equal(apply(freshPlan({}, true), {}, true).status, 0);

    ok(formulaSeedSql);
    ok(`INSERT INTO "QuestionFormulaDefinitions" ("Id", "QuestionId") VALUES (gen_random_uuid(), '${ids.uniformityQuestion}');`);
    assert.match(apply(freshPlan()).stderr, /governance/);

    ok(formulaSeedSql);
    ok(`UPDATE users SET "IsDisabled" = true WHERE "Id" = '${ids.actor}';`);
    assert.match(apply(freshPlan()).stderr, /CanEditQuestions/);
    assert.equal(definition(), uniformityDefinition);
  });
});
