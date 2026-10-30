# Formula configuration repairs

When a formula question is saved with a bad configuration, analysts get stuck: the
app counts a formula answer as complete only when every input its configuration asks
for is filled, so "Submit results" stays disabled. Two real examples on ATR
`01a1886d-2a13-71d7-b712-4ad6b1a338b3`:

- **Uniformity of Weight**: N (`sampleCount`) is 0 and decimals are unset, so no
  individual weight can ever be entered.
- **Dissolution**: the expression uses `:stdconc` and `:splconc`, which nothing in
  the worksheet supplies. They should be the data table averages (`:standardAvg`,
  and `:sampleAvg`, which the app expands to `:sample1Avg`, `:sample2Avg`, …).

Formula questions cannot be corrected in the app today. The question editor refuses to
save Uniformity and worksheet formulas (`scalar-adapter-guard.ts` only accepts simple and
universal scalar formulas), and even a governed formula revision does not change the
definition the worksheet and the completeness check read: the question's single
`QuestionOptions."Name"` text. This repair corrects that text, case by case, from a
reviewed recipe that carries either targeted changes or the full corrected definition.

Approved formula revisions are never rewritten. The calculation service re-checks each
revision's definition hash (`FormulaExecutionFactory`), and changing an approved revision
in place would bypass its review and approval record.

## What it will and will not do

- Changes one formula question's stored definition, and optionally the saved answers
  of named **open** responses (not checked, approved, rejected or submitted, with no
  formula snapshots).
- Refuses a question under formula governance, or answered through a governed form
  revision placement. Those need a formula revision and a response rebase, which this
  script does not do.
- Refuses when closed responses answered the question, unless
  `--allow-closed-responses` is given. The definition is shared, so their worksheets
  will display with the corrected settings. Get QA's agreement first.
- Refuses when the stored definition or an answer differs from what the recipe was
  written against (SHA-256 check, repeated under lock at write time).
- Never runs a calculation, submits, approves or releases anything.

The question is shared by every form that uses it; the preview lists them all.

## Prerequisites

Same as [production activity repairs](production-activity-repairs.md): Bun 1.3.14,
`psql`, a backed-up database, and credentials from `PGPASSFILE` or the libpq
environment, never a connection string or password argument. The operator UUID is
audit attribution, not authentication. It must belong to an active user whose active
role has the existing `CanEditQuestions` permission. The first write creates
`public."_FormulaConfigRepairs"`, which keeps the recipe, reason, and the definition
and answers before and after.

Run `bun install` first: the preview then uses the app's own completeness check to
show, per open answer, whether it counts as complete before and after the change.

### Connecting with DATABASE_URL

Instead of `--host`, `--port` and `--database` you can put the connection in a `.env`
file at the repository root (git ignores it). Bun loads it automatically:

```sh
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Percent-encode `@`, `:`, `/` and `#` in the password (`@` becomes `%40`). Only the
`sslmode` option is accepted. The script splits the URL into libpq environment
variables for `psql`, so the password never appears in a command line or in output. It
prints the database, host and user it connects to. If you also pass `--host`, `--port`
or `--database`, they must match the URL. Delete the URL from `.env` when you are done.

## 1. Find the questions (read only)

```sh
bun run repair:formula-config find \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --atr 01a1886d-2a13-71d7-b712-4ad6b1a338b3
```

The JSON lists the ATR's forms, each formula field with its `questionId`, the stored
definition and its `sha256`, whether it is governed, how many forms use it, and the
ATR's responses with their saved formula answers.

## 2. Write the recipe

Start from a template in `scripts/repairs/formula-config/recipes/`. Fill
`questionId` and `expectedDefinitionSha256` from `find`. Templates fail to load until
both are real values. Confirm the values with QC before applying.

```json
{
  "name": "ATR 01a1886d: Uniformity of Weight tablet sample count",
  "note": "Why this is wrong and who confirmed the fix.",
  "questionId": "…",
  "expectedDefinitionSha256": "…",
  "definition": [
    { "op": "set", "path": ["sampleCount"], "value": 20 },
    { "op": "set", "path": ["decimalPlaces"], "value": 2 }
  ],
  "answers": {
    "responseIds": ["…"],
    "operations": [{ "op": "padArray", "path": ["inputs", "indWts"], "length": 20, "fill": "" }]
  }
}
```

Operations apply to the formula settings object (the one with `expression` or
`mode`), whatever JSON-string wrapping it is stored in. The wrapping is kept.

| op | Effect |
| --- | --- |
| `replace` | Replaces the whole settings object with `value` (the full corrected definition). |
| `set` | Sets `path` to `value`. |
| `remove` | Removes `path`; fails if nothing is there. |
| `renameVariable` | Renames `:from` to `:to` as a whole token in every expression, and `from` keys in `manualVars`/`manualVarLabels`. Fails if `:from` is not used. |
| `padArray` | Pads the array at `path` to `length` with `fill`. |

`answers` is optional. Uniformity answers rarely need it: the worksheet pads
individual weights to N itself.

## 3. Preview, then apply

```sh
bun run repair:formula-config repair \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --recipe scripts/repairs/formula-config/recipes/atr-01a1886d-uniformity-of-weight.json \
  --actor OPERATOR_USER_ID --reason "Set the tablet count confirmed by QC"
```

The preview shows the settings before and after, every form using the question, open
and closed responses, answer changes, and the completeness comparison. It writes
nothing. Add `--apply` to write in one transaction. Running it again refuses, because
the stored definition no longer matches the recipe's hash.

After applying, the analyst reloads the test page and enters the values the
corrected formula now asks for (for uniformity, the individual weights).

## Testing

`node --test tests/formula-config-repair.test.ts` runs the unit tests. To also run the
SQL against PostgreSQL, point it at an empty, dedicated database named
`oryx_formula_test_*` with `ORYX_REPAIR_TEST_HOST`, `ORYX_REPAIR_TEST_PORT` and
`ORYX_REPAIR_TEST_DATABASE`.
