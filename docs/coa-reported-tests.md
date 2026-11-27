# COA reported tests

A certificate of analysis shows only the tests chosen for it. Unreported tests are still performed and kept on the worksheet and its print.

- **Template:** each question in the template editor has **Report on COA** beside **Required** (`modules/form-templates/components/question-card.tsx`). It is on by default. It is saved through the existing field writes under the template edit permission.
- **Product specification override:** **Microbial tests on COA** on the specification page (`modules/product-specifications/components/coa-reporting-dialog.tsx`). It needs `CanViewProductCoaReportedTests` to open and `CanEditProductCoaReportedTests` to change. Only choices that differ from the template are sent. A reason is required, and saving sends the specification for approval again. The endpoint takes an analysis type, so a chemical screen can reuse it.
- **Certificates:** the server resolves each field (override, else template) and returns the fields left off as `coaHiddenFieldIds` on the response detail. `coaSections` (`shared/ard-view/raw-data/coa-sections.ts`) removes those fields and drops sections with none left. Every certificate call site applies it: QC product and material results, rework check, pending-approval ARD details and its COA print, and the pending-certificate edit. The overall "complies" and "Review required" then consider only the reported tests. Worksheet views and prints are not filtered.

Backend: `SpecificationCoaReportingController`, `CoaReportingRuntime`, migrations `AddCoaReportedTests` and `GrantProductCoaReportedTestKeys`.

## Material specifications

Material specifications have the same override ("Microbial tests on COA" on the specification page), through
`GET`/`PUT /api/v1/material-specifications/{id}/coa-reporting/{analysisType}`. The keys follow the specification's
material kind: `CanViewRawMaterialCoaReportedTests` / `CanEditRawMaterialCoaReportedTests` for raw materials and
`CanViewPackagingMaterialCoaReportedTests` / `CanEditPackagingMaterialCoaReportedTests` for packaging. The dialog is
shared (`shared/coa-reporting`) and takes the specification kind and its keys. Deploy the backend with
`AddMaterialCoaReportedTests` and `GrantMaterialCoaReportedTestKeys` first.
