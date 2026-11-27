# Specification microbial template

Date: 2026-11-27. Companion backend change: `docs/specification-microbial-template.md` in oryx-backend (migration `AddSpecificationMicrobialTemplate`).

A material or product specification now has two templates:

- **Chemical template** (`form`, required), the one it always had.
- **Microbial template** (`microbialForm`, optional), whose sections are the microbial tests (TAMC, TYMC, specified organisms).

Each template keeps its own test references, so a microbial reference never overwrites a chemical one.

## Screens

| Where | What changed |
| --- | --- |
| Specification create / edit (material and product) | "Template" is now "Chemical template". A new optional "Microbial template" picker sits below it. Choosing the same template in both is refused. |
| Specification detail | Shows both templates. When there is a microbial template, the tests are shown as "Chemical tests" and "Microbial tests". |
| Set test references | One table per template, under "Chemical tests" and "Microbial tests". Every test in both still needs a reference before saving. |
| Specification print | Prints "Chemical tests" and "Microbial tests" as two tables when there is a microbial template. Otherwise it prints one "Tests" table, as before. |
| Routine setup → New microbial ARD | After the STP is chosen, the app reads the material's specification (or the product's Finished-stage specification). If it names a microbial template, the worksheet and specification number are filled in and locked, because the server refuses a different template. |

## Code

- `shared/specifications/specification-schema.ts`: `microbialForm` on the specification, each test tagged `analysis` (`chemical` / `microbial`), with `byAnalysis` and `asAnalysis` helpers.
- `shared/specifications/use-specification-tests.ts` loads both templates and returns the chemical tests followed by the microbial tests.
- `shared/specifications/specification-rules.ts`: the `microbialForm` field, a check that it differs from the chemical template, and the body and defaults. `microbialTemplateField` is shared by both editors.
- `modules/qc-routines/lib/microbial-slot.ts` reads a specification's microbial slot for the microbial ARD dialog.

No new permission keys. The specification edit, complete and print keys are unchanged.
