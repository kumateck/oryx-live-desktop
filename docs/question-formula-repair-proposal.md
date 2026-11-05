# Permissioned question and test formula repair

Status: implemented locally, 5 November 2026; not committed, migrated or deployed.
No permissions have been granted. Scope is legacy formula questions and open ATR
test responses. Other question types need their own validation and migration rules.

## Implementation (5 November 2026)

- Backend: `FormulaRepairController` (`/api/v1/formula-repairs`) and
  `QuestionFormulaRepairService` provide context, preview, apply, history and
  server recalculation. Permissions are `CanRepairQuestionFormula` and
  `CanRepairTestFormula`; neither widens ATR department or field-assignment access.
- Storage: one migration, `AddLegacyFormulaRepairs`, adds `QuestionFormulaRepairs`
  (actor, reason, scope, before/after definitions, full pre-image, invalidated
  readings), `LegacyFormulaConfigurationPins` and `LegacyFormulaRepairEvaluations`.
  Database triggers refuse UPDATE, DELETE and TRUNCATE on all three tables.
- Concurrency: the calculation service is called before any lock. Apply then takes
  an exclusive per-question advisory lock, table locks and a serializable
  transaction, rebuilds the preview and requires the same token (bound to the
  operator), and rechecks permissions just before writing. Formula draft saves
  hold the same question lock shared, so a save cannot pass the configuration-hash
  check and then land after a repair. Recalculation runs the engine without locks
  and rechecks permission, record state, pin and readings before recording.
- Forms whose tests have repaired history refuse field replacement with a clear
  409, because the form editor deletes and recreates fields.
- Desktop: Questions → Repair formula and the ATR test page's formula menu open
  `/settings/questions/formula/:id/repair`. The flow is configuration → scope →
  preview (before/after, per-test impact, missing inputs, blockers) → reason →
  apply. Changing the configuration or scope hides the preview; the reason does
  not. 403 shows a denied state without retry, 409 asks for a fresh preview and
  reloads the context, and a lost response retries with the same request ID. The
  ATR page shows which repaired formulas need recalculation.

Verification: `QuestionFormulaRepairTests` (in-memory; a PostgreSQL test gated by
`ORYX_FORMULA_REPAIR_TEST_CONNECTION` runs all migrations and checks the triggers
and draft-save lock; two engine tests gated by `ORYX_FORMULA_REPAIR_SERVICE_URL`),
plus desktop `formula-repair` and `atr-formula-actions` tests.

Known limits: Oryx Next does not send `formulaConfigurationHash`, so once a
question is repaired its formula answers can only be saved from the desktop.
Submitted, approved and governed records are refused (separate amendment work).

## Why a separate action is needed

The formula question editor saves a governed draft through
`FormulaQuestionController`; saving does not replace a legacy worksheet's
`QuestionOptions.Name`. `FormulaAnswerField` still passes that shared definition
to its evaluator. Consequently, correcting the master and correcting a saved
test configuration are different operations.

The existing maintenance script demonstrates hash checking, state checks and
atomic audit, but accepts an operator UUID supplied by the caller. An in-app
repair must derive the operator from the authenticated backend identity.

## User workflow

Expose **Repair formula** from question actions and from a formula field in an
ATR test. Both entry points open the same repair workspace. The ATR entry point
preselects its exact response and field placement; the question entry point
shows affected forms and eligible tests.

| Scope | Intended effect |
| --- | --- |
| Question only | Correct the reusable legacy configuration for templates and future tests; retain existing tests' pinned definitions. |
| Selected tests only | Correct the configuration of explicitly selected open responses/placements without changing the shared question. |
| Question and selected tests | Apply both changes atomically, preserving other tests' definitions. |

Require a reason. Reuse the formula builder and typed configuration validation;
do not provide an arbitrary SQL/JSON-patch console. Initially retain the question
type and stable field/input identities. Preview the expression, input labels,
constants, table shape and precision before and after, plus the full impact list,
retained readings, missing inputs, mapping conflicts and blocked records.

Explicitly select each affected test; never silently select every open test.
Show **Preview repair**, then **Apply repair** against that exact preview. Return
an audit reference and reload the affected configuration after success. Unsaved
worksheet edits must be saved or deliberately discarded before applying; a
repair must not overwrite an analyst's in-memory work.

## Permissions and record access

Introduce two explicit permissions in the backend catalog before adding client
requirements: **repair question formula configuration** and **repair open test
formula configuration**. These are proposed capabilities, not existing keys.
Question-and-test repair requires both. Ordinary question edit, test start,
formula execution or administrator role names do not imply repair permission.

Retain existing question/ATR visibility, department, assignment and record-state
rules. A test repair additionally needs the existing access to that exact test;
repair permission does not confer access to another department or assignment.
Use the current server permission set for preview and apply, repeat checks inside
the write transaction, and derive the actor from the session. Do not accept an
actor ID or permission override from the browser. Grants remain an explicit
role-management action, with no automatic grant to current editors or admins.

## Preserve history before changing the shared master

A plain update to `QuestionOptions.Name` would change what unselected legacy
tests display. A product feature must close this gap before offering all three
scopes: capture immutable, versioned legacy configuration and pin existing
responses to their actual pre-repair definition per field placement, even when
they have no saved formula answer. Selected open tests receive an explicit new
configuration version; other responses retain their prior version.

Use one backend configuration-resolution contract for entry, completeness,
evaluation, submission, worksheet viewing and printing. The newest shared
question must never silently override a response's pinned definition. Audit
initial capture accurately as a repair-time capture; do not claim to reconstruct
historical settings that cannot be proven. Refuse ambiguous historical evidence.

This legacy configuration pin is distinct from approval of a governed formula.
Existing `ResponseFormulaSnapshots` require a formula revision foreign key and
verified hashes; do not manufacture an approved revision to populate that table.
Finalize the legacy storage contract before implementation. If historical and
unselected views cannot be preserved, block shared-master repair.

## Repairing an involved test

An eligible test is open, unchecked, unsubmitted, unapproved and unrejected,
with no pending certificate/approval, released certificate or downstream release
evidence. Resolve ATR, response, form and placement on the server; do not trust
an arbitrary browser-supplied response ID. Recheck all gates under lock.

Preserve entered readings verbatim, including decimal strings, weights and
manual values. Map by stable input keys and table identities, never labels or
array position alone. Preview deterministic renames; block ambiguous moves,
destructive shape changes or dropped readings. New inputs remain empty. Keep
the original answer/configuration in immutable repair evidence.

Invalidate calculated results when their definition or bindings change. Do not
leave an old result displayed or accepted as valid under a new expression. Mark
the test as needing completion/recalculation and block certificate generation
and submission until the normal validated execution path succeeds. Do not
automatically submit, approve, release or change ATR/production workflow status.

Validate syntax, referenced variables, input definitions and configuration on
the server. Use the established calculation service for supported contracts;
unsupported contracts block execution rather than falling back to an
authoritative-looking browser result. Missing new inputs are clearly reported,
not populated with guessed values. A calculation-service outage must not be
reported as a successful validated repair.

## Governed and completed records

First delivery refuses direct repair of governed questions, governed placements,
submitted/checked tests and approved/released results. Existing approved
definitions, snapshot sequences, executions and submission sets are immutable.

A later governed repair can be a dedicated entry point that selects an already
approved corrected revision and explicitly rebases eligible responses, appending
a superseding snapshot. It must retain the normal review/approval requirements.
The enum values `ApprovedRebase`, `HistoricalCorrection` and `Correction` exist,
but a complete rebase/amendment workflow is not implemented by those enum values.
Completed tests need a separate reviewed amendment process, including certificate
and downstream impact, rather than resetting approval/status fields.

## Backend contract and verification

Provide typed preview/apply endpoints owned by a formula-repair service. Bind a
preview token to the candidate configuration, scope, exact target placements,
current definitions, answers, snapshot versions, status/approval evidence and
shared impact set. Apply requires that token, the reason and a stable request ID.

Use a serializable transaction and locks that conflict with ordinary question
editing, answer saves, submission and approval. Detect concurrent target/impact
changes, recheck current permissions immediately before writes, and return a
conflict requiring a fresh preview. Scope request replay to actor and exact
payload; identical retries return the committed repair, changed payloads refuse.
No automatic retry of refused mutations or access-denied responses.

Write append-only repair evidence atomically with configuration changes: actor,
reason, UTC time, targets, scope, before/after definitions and hashes, preserved
input mapping, invalidated result references and request identity. Failure rolls
back changes and audit together. A reverse correction is another audited repair,
not deletion of evidence. History is readable to authorized users.

Generate domain-scoped API clients from the backend contract. Keep question UI
in the questions module, ATR integration in analytical-test-requests, and the
cross-module repair DTOs/configuration contract explicit. Reuse action menus,
permission guards, RHF/Zod forms and scrollable dialog layout conventions.

Required verification includes permission revocation, foreign department and
assignment denial, no-answer tests, multiple placements, exact decimal retention,
missing/renamed inputs, table changes, stale previews, concurrent saves and
submission, replay after response loss, audit failure rollback, server outages,
governed/closed refusal and unchanged unselected/historical views and prints.
Use the two cases from this chat as fixtures. Check route coverage, generated
API types, build/typecheck, keyboard access and target desktop sizes.

## Recommended delivery

Deliver legacy formula repair for the question, selected open tests, or both,
together with response configuration pinning, result invalidation and immutable
history. Keep governed rebasing and completed-test amendment as separate work.
This is an exceptional permissioned repair path alongside the normal editor.
