import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { retainedTables, retainedPrefixes, selectiveTables, clearedTables } from "./manifest.ts";

const schemaType = z.object({
  tables: z.array(z.object({ name: z.string() })),
  columns: z.array(z.object({ table_name: z.string(), name: z.string(), type: z.string(), nullable: z.boolean() })),
  foreignKeys: z.array(z.object({ child: z.string(), parent: z.string(), name: z.string(), deferrable: z.boolean(), deferred: z.boolean(), columns: z.array(z.string()), target_columns: z.array(z.string()) })),
});
const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) throw new Error("Usage: bun generate.ts schema.json output.sql");
const schema = schemaType.parse(JSON.parse(await readFile(input, "utf8")));
const tables = schema.tables.map((t) => t.name);
const keep = tables.filter((t) => retainedTables.includes(t) || retainedPrefixes.some((p) => t.startsWith(p)));
const selected = tables.filter((t) => selectiveTables.includes(t));
const clear = tables.filter((t) => clearedTables.includes(t));
const declarations = [...retainedTables, ...selectiveTables, ...clearedTables];
const missing = declarations.filter((t) => !tables.includes(t));
const unclassified = tables.filter((t) => !keep.includes(t) && !selected.includes(t) && !clear.includes(t));
if (missing.length || unclassified.length || new Set(declarations).size !== declarations.length) throw new Error(JSON.stringify({ missing, unclassified }));
const qi = (v: string) => `"${v.replaceAll('"', '""')}"`;
const qs = (v: string) => `'${v.replaceAll("'", "''")}'`;
const tab = (v: string) => `public.${qi(v)}`;
const uuidId = (t: string) => schema.columns.some((c) => c.table_name === t && c.name === "Id" && c.type === "uuid");
const retained = (t: string, alias: string) => keep.includes(t) ? "true" : `EXISTS (SELECT 1 FROM _retain k WHERE k.table_name=${qs(t)} AND k.id=${alias}."Id")`;
const removed = (t: string, alias: string) => clear.includes(t) ? "true" : `NOT (${retained(t, alias)})`;
const removable = [...clear, ...selected];
const nullable = (t: string, c: string) => schema.columns.some((x) => x.table_name === t && x.name === c && x.nullable);

// Nullable references to deleted rows are explicitly detached before child-first deletion.
const hardEdges = schema.foreignKeys.filter((f) => removable.includes(f.child) && removable.includes(f.parent) && !f.columns.some((c) => nullable(f.child, c)) && f.child !== f.parent);
const deletionOrder: string[] = [];
const remaining = new Set(removable);
while (remaining.size) {
  const leaves = [...remaining].filter((t) => !hardEdges.some((f) => f.parent === t && remaining.has(f.child)));
  if (!leaves.length) throw new Error(`Non-nullable deletion cycle requires review: ${[...remaining].join(", ")}`);
  for (const t of leaves) { deletionOrder.push(t); remaining.delete(t); }
}
const statements: string[] = [
  "\\set ON_ERROR_STOP on", "BEGIN;", "SET LOCAL lock_timeout='10s';", "SET LOCAL statement_timeout='120s';",
  "SELECT pg_advisory_xact_lock(hashtext('oryx-fresh-data-reset'));",
  `DO $$ BEGIN IF current_database() NOT IN ('oryx_client_20261030','oryx_rehearsal_20261101_203716') THEN RAISE EXCEPTION 'Database is outside the authorized reset scope'; END IF; END $$;`,
  `LOCK TABLE ${tables.map(tab).join(", ")} IN SHARE ROW EXCLUSIVE MODE;`,
  // Keep FK triggers active. Only application triggers on the explicitly cleared/selective
  // tables are suspended for this authorized reset, and their exact enabled states are restored.
  `CREATE TEMP TABLE _triggers ON COMMIT DROP AS SELECT c.relname AS table_name,t.tgname AS name,t.tgenabled AS enabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname IN (${removable.map(qs).join(",")});`,
  `DO $$ DECLARE r record; BEGIN FOR r IN SELECT * FROM _triggers WHERE enabled<>'D' LOOP EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I',r.table_name,r.name); END LOOP; END $$;`,
  "CREATE TEMP TABLE _retain(table_name text NOT NULL,id uuid NOT NULL,PRIMARY KEY(table_name,id)) ON COMMIT DROP;",
  "CREATE TEMP TABLE _fingerprint(table_name text PRIMARY KEY,row_count bigint,digest text) ON COMMIT DROP;",
  "CREATE TEMP TABLE _counts(table_name text PRIMARY KEY,policy text,before_count bigint,after_count bigint) ON COMMIT DROP;",
  "CREATE TEMP TABLE _unlinked(table_name text,column_names text,rows bigint) ON COMMIT DROP;",
];
for (const t of keep.filter(uuidId)) statements.push(`INSERT INTO _retain SELECT ${qs(t)},"Id" FROM ${tab(t)};`);
const backwards = [
  ["Attachments", 'p."ModelId"'], ["ApprovalActionLogs", 'p."ModelId"'], ["QcApprovals", 'p."EntityId"'],
  ["FormResponses", 'p."ResponseId"'], ["ResponseApprovals", 'p."ResponseId"'],
  ["ResponseFormulaSnapshots", 'p."ResponseId"'], ["FormulaExecutions", 'p."ResponseFormulaSnapshotId"'],
  ["ResponseFormulaSubmissionSets", 'p."ResponseId"'], ["ResponseFormulaSubmissionExecutions", 'p."ResponseFormulaSubmissionSetId"'],
  ["RndProjectApprovals", 'p."RndProjectId"'],
] as const;
const closure: string[] = [];
for (const f of schema.foreignKeys.filter((f) => (keep.includes(f.child) || selected.includes(f.child)) && selected.includes(f.parent) && f.columns.length === 1 && f.target_columns[0] === "Id" && uuidId(f.parent))) {
  const col = f.columns[0]; if (!col) throw new Error("Missing FK column");
  closure.push(`INSERT INTO _retain SELECT DISTINCT ${qs(f.parent)},p.${qi(col)} FROM ${tab(f.child)} p WHERE p.${qi(col)} IS NOT NULL AND ${retained(f.child, "p")} ON CONFLICT DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; changed=changed+n;`);
}
for (const [t, key] of backwards) closure.push(`INSERT INTO _retain SELECT ${qs(t)},p."Id" FROM ${tab(t)} p WHERE EXISTS (SELECT 1 FROM _retain k WHERE k.id=${key}) ON CONFLICT DO NOTHING; GET DIAGNOSTICS n=ROW_COUNT; changed=changed+n;`);
statements.push(`DO $$ DECLARE changed bigint; n bigint; BEGIN LOOP changed=0; ${closure.join("\n")} EXIT WHEN changed=0; END LOOP; END $$;`);

// Retained content must stay byte-equivalent apart from obsolete nullable transaction pointers.
const ignoredColumns = (t: string) => schema.foreignKeys.filter((f) => f.child === t && clear.includes(f.parent)).flatMap((f) => f.columns.filter((c) => nullable(t, c)));
const fingerprint = (t: string) => `SELECT count(*),md5(COALESCE(string_agg(md5((to_jsonb(p)-ARRAY[${ignoredColumns(t).map(qs).join(",")}]::text[])::text),'' ORDER BY md5((to_jsonb(p)-ARRAY[${ignoredColumns(t).map(qs).join(",")}]::text[])::text)),'')) FROM ${tab(t)} p WHERE ${retained(t, "p")}`;
for (const t of tables) {
  const policy = keep.includes(t) ? "retain" : selected.includes(t) ? "retain selected master support" : "clear dummy transactions";
  statements.push(`INSERT INTO _counts SELECT ${qs(t)},${qs(policy)},count(*),NULL FROM ${tab(t)};`);
  if (!clear.includes(t)) statements.push(`INSERT INTO _fingerprint SELECT ${qs(t)},s.* FROM (${fingerprint(t)}) s;`);
}
for (const f of schema.foreignKeys.filter((f) => removable.includes(f.parent))) {
  const match = f.columns.map((c, i) => { const target = f.target_columns[i]; if (!target) throw new Error("Missing target FK column"); return `c.${qi(c)}=p.${qi(target)}`; }).join(" AND ");
  const nullCols = f.columns.filter((c) => nullable(f.child, c));
  const refersToRemoved = `EXISTS (SELECT 1 FROM ${tab(f.parent)} p WHERE ${match} AND ${removed(f.parent, "p")})`;
  if (!nullCols.length) {
    if (!clear.includes(f.child)) statements.push(`DO $$ BEGIN IF EXISTS(SELECT 1 FROM ${tab(f.child)} c WHERE ${retained(f.child, "c")} AND ${refersToRemoved}) THEN RAISE EXCEPTION 'Retained row depends on cleared nonnullable parent: ${f.child} -> ${f.parent}'; END IF; END $$;`);
    continue;
  }
  statements.push(`DO $$ DECLARE n bigint; BEGIN UPDATE ${tab(f.child)} c SET ${nullCols.map((c) => `${qi(c)}=NULL`).join(",")} WHERE ${refersToRemoved}; GET DIAGNOSTICS n=ROW_COUNT; IF n>0 THEN INSERT INTO _unlinked VALUES(${qs(f.child)},${qs(nullCols.join(","))},n); END IF; END $$;`);
}
for (const t of deletionOrder) statements.push(`DELETE FROM ${tab(t)} p WHERE ${removed(t, "p")};`);
for (const t of tables) {
  statements.push(`UPDATE _counts SET after_count=(SELECT count(*) FROM ${tab(t)}) WHERE table_name=${qs(t)};`);
  if (clear.includes(t)) statements.push(`DO $$ BEGIN IF EXISTS(SELECT 1 FROM ${tab(t)}) THEN RAISE EXCEPTION 'Transaction table was not emptied: ${t}'; END IF; END $$;`);
  else statements.push(`DO $$ BEGIN IF EXISTS(SELECT 1 FROM _fingerprint b CROSS JOIN (${fingerprint(t)}) a(row_count,digest) WHERE b.table_name=${qs(t)} AND (b.row_count<>a.row_count OR b.digest<>a.digest)) THEN RAISE EXCEPTION 'Preserved data changed: ${t}'; END IF; END $$;`);
}
statements.push(`DO $$ DECLARE r record; action text; BEGIN FOR r IN SELECT * FROM _triggers LOOP action=CASE r.enabled WHEN 'O' THEN 'ENABLE' WHEN 'R' THEN 'ENABLE REPLICA' WHEN 'A' THEN 'ENABLE ALWAYS' ELSE 'DISABLE' END; EXECUTE format('ALTER TABLE public.%I %s TRIGGER %I',r.table_name,action,r.name); END LOOP; IF EXISTS(SELECT 1 FROM _triggers b JOIN pg_class c ON c.relname=b.table_name JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_trigger t ON t.tgrelid=c.oid AND t.tgname=b.name WHERE t.tgenabled<>b.enabled) THEN RAISE EXCEPTION 'Trigger state was not restored'; END IF; END $$;`);
statements.push("SELECT json_build_object('tables',(SELECT json_agg(c ORDER BY table_name) FROM _counts c),'detachedTransactionPointers',(SELECT json_agg(u) FROM _unlinked u),'preservationVerified',true,'allTransactionTablesEmpty',true,'applicationTriggersRestored',true);", "COMMIT;");
await writeFile(output, statements.join("\n")+"\n");
await writeFile(output.replace(/\.sql$/, ".manifest.json"),JSON.stringify({total:tables.length,keep,selected,clear,deletionOrder},null,2));
console.log(JSON.stringify({tables:tables.length,retained:keep.length,selective:selected.length,cleared:clear.length,output}));
