# Payroll implementation — 2026-10-21

## Contracts and permissions

The existing Payroll controller operations are listed in `api-untyped-operations.md` because OpenAPI omits their response annotations. Live uses narrow handwritten endpoints with Zod response validation, preserving all published DTO fields and numeric enums. No generated API file or payroll backend implementation changed. Shared pay-grade contracts/transport live in `shared/payroll`; configuration and compensation use the same query and invalidation tags. Writes carry `HR Management / Payroll Configuration`, `Employee Compensation` or `Payroll Runs` audit headers.

The configuration route requires `CanViewPayrollConfiguration`; all create/edit/delete boundaries recheck `CanManagePayrollConfiguration`. Compensation reads require `CanViewCompensation`; writes require that plus `CanManageCompensation`. Selecting/changing a graded salary requires access to current pay-grade ranges. Payroll runs require `CanViewPayrollRuns`; payslip routes and embedded reads require `CanViewPayslip`. Create/submit, approve/process, cancel and each export use their separate existing keys. No superuser bypass was added.

## Configuration

Tax bands, SSNIT rates and pay grades have client paging over the complete returned lists and short shared form dialogs. The UI preserves zero rates/levels/salary, validates ordered salary ranges, percentage bounds and effective periods, and distinguishes a blank uncapped tax bound from an explicit zero. Saved records are frozen and reread before edit/deletion. Duplicate grade names, overlapping income/effective tax brackets and equal-start pension rates are refused. Failed creates are not blindly repeated.

The tax-band endpoint omits every band with an end date. The screen states that the list is not a complete historical schedule. The overlap check can verify only returned records; authoritative historical tax scheduling and overlap/concurrency validation remain a server responsibility. No statutory rate defaults or legislative advice is introduced.

## Compensation

Active employee selection opens current compensation, its salary, all allowances and taxability, grade, bank details, TIN, Tier 3 enrollment, effective dates and history. New compensation copies all current values while requiring an explicit new effective date. It supersedes the current record; it does not edit history in place. The save checks current evidence, employee eligibility and selected grade/range before writing. An unconfirmed effective-dated save requires checking history instead of repeating it.

Additions, deductions and annual tax reliefs retain every type/amount, description, recurrence/taxability and effective end date. Every page is read and validated before display or deletion; missing/duplicate identities and cross-employee rows are refused. Server paging is retained for full compensation history and a read-only record dialog exposes every historical field. Only the permission to read compensation is needed for viewing; the reference incorrectly required management permission for the whole page.

Known payroll calculation behavior is explained rather than hidden: the server selects adjustments by effective period and does not enforce their recurring flag, so non-recurring additions/deductions require an explicit end date. Tier 3 enrollment is retained but the current calculation does not generate a Tier 3 contribution from it. Fixing those calculations is a separate backend change, not part of the approved session ownership repair.

## Runs, approvals and payslips

The run register supports all statuses including draft `0`, server paging and draft creation with ordered periods. It retains all run totals. Dedicated details show generated payslips when permitted, original export viewers and approval history. Payslip pages and print preview retain all identity/period fields, all 12 monetary summary fields and every typed line item, including employer/tier-2/relief values omitted from the reference presentation.

State actions freeze evidence and reread status/totals before writes. Approve/reject also recheck the caller's actual pending assignment and block the requester from reviewing their own run. Approval reads complete active employee and payslip registers, checks unique employee identity and period/run ownership, rejects negative net pay or unreconciled payslips, compares complete coverage and reconciles every run summary total. The approval dialog requires `CanViewActiveEmployee` and `CanViewPayslip` alongside `CanApprovePayrollRun` for this verification.

The generic pending approval queue now routes payroll to the dedicated HR workflow; generic approve/reject buttons are disabled so those reconciliation checks cannot be bypassed. Direct payroll decisions invalidate their own list/detail/payslip tags as well as the generic approval cache behavior.

Server gaps: generation catches calculation errors and silently skips affected employees. Approval therefore blocks coverage differences. Rejection returns the run to draft while retaining its payslips; a later server submit would append duplicates. Live refuses resubmission when a draft already has generated payslips and explains cancellation/replacement. Process/paid is an explicit confirmed status change, does not transfer money and requires both approved status and the server-approved flag. Cancellation is refused for processed/cancelled runs.

Bank advice and the payroll register request the actual existing `FileType=xlsx` contract. Their original bounded XLSX bytes open through the central read-only attachment viewer, with fresh access and session-identity checks. No external document service is connected. CSV from the current backend is not offered here because its string concatenation does not escape employee names/account fields; the reference uses XLSX. Bank advice uses *current* compensation bank details rather than a period snapshot; the screen identifies this limitation before use.

## Verification and remaining scope

Focused configuration/compensation suites: 18 passing tests. Run/reconciliation/export suites: 13 passing tests before adding the generic-entry integration check. Web TypeScript passed and the production web build passed. Related generic approval regressions are being rerun after changing where payroll is decided. All business mutations are mocked; no real payroll, bank transfer, HR decision or deployment was performed.

Self-service own-payslip navigation is not introduced: the reference has no such page and the session profile has no employee ID to bind safely. The existing employee-ID endpoint needs a separate ownership contract review rather than guessing an employee ID from a user ID. Integrated live verification and target-screen checks remain pending while the running server still uses the old session-renewal implementation.
