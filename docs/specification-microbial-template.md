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

# Microbial question types and limits (step 2)

Companion backend: "Microbial question types and typed limits" in oryx-backend `docs/specification-microbial-template.md`.

## Questions (Settings → Questions)

New types: Organism, Dilution, Incubation, Colony count, CFU calculation and Growth observation. A CFU calculation asks for the unit it reports in (cfu/g, cfu/mL or cfu/plate). In a template, the test that holds a CFU calculation also needs one colony count and one dilution question. The server refuses an ARD on a template that breaks this.

## Worksheet

| Type | Entered as |
| --- | --- |
| Organism | A pick from the fixed organism list |
| Dilution | Sample amount and unit, diluent mL and dilution factor. The factor fills in from sample and diluent and can be overridden. |
| Incubation | Temperature, period in hours, start, and end. Save the start now and the end when the plates come out. The answer is complete only once it has an end. |
| Colony count | Two to four plate counts, or "Too numerous to count". The average is shown. |
| CFU calculation | Read only. The server calculates it when the count or dilution is saved. It has no save button. |
| Growth observation | Absent / Present |

Answers are stored in the server's JSON formats (`shared/microbial/microbial-values.ts`), so prints and approvals show them as text, for example "10 g in 90 mL · 1 in 10" or "135 cfu/g".

## Microbial limits (specification detail)

A **Microbial limits** button appears on a material or product specification that has a microbial template. It lists the template's CFU and growth results with their limit, for example "NMT 1000 cfu/g" or "Absence of Escherichia coli in 1 g".

**Edit limits** sets the limits with a reason. Saving applies them to every item on the specification number and sends the specification for approval again. When QC checks the certificate, the server applies these limits itself, so the compliance shown for a limited test is the server's verdict.

| Key | Use |
| --- | --- |
| `CanViewRawMaterialMicrobialLimits` / `CanViewPackagingMaterialMicrobialLimits` / `CanViewProductMicrobialLimits` | See the button and the limits |
| `CanEditRawMaterialMicrobialLimits` / `CanEditPackagingMaterialMicrobialLimits` / `CanEditProductMicrobialLimits` | Edit limits |

## Contract

`scripts/import-microbial-testing.ts` imports only QuestionType 15–20, the two microbial-limits paths and their six `DOMAIN.Entities.Forms` schemas. Reviewed digest `e56fcfcf76c7d93317c89e5254074a651a280ffcff854889981a950054f0a541`. Removing these additions restores `2a51d78c…512c`.
