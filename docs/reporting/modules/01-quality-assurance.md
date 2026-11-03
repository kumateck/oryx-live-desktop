# QA reporting: first module review

Status: source-based draft for business review, 2026-11-02. QA-01 has a local
implementation and agreed print presentation; its QA-only provenance meaning
needs a further decision identified by this study. QA-02 through QA-06 are
proposed contracts, not newly implemented reports. No customer database was read.

## Workflow and ownership

1. Production creates a batch and requests its manufacturing/packaging record.
   The BMR has its own identity and product/schedule/step links.
2. QA supplies batch number, manufacturing/expiry dates and quantity/unit, then
   issues the record. The normal writer stamps `IssuedDate`/`IssuedById`, completes
   the issue step and updates its packaging record. Saving details is a different
   operation from issuing.
3. Product analytical test requests identify the batch, production stage and
   request/attempt. QA sampling and QC analysis have different queues and grants.
4. QC receives/acknowledges, assigns and tests. Test submission, review and final
   release are distinct. A test stage release is not necessarily final batch release.
5. Legacy final response approval can set the BMR's quality status to Approved
   when required ATR stages are released. Rebuilt worksheet OOS disposition can
   instead make a quarantined batch Available after a favourable disposition.
6. OOS/retest evidence must remain linked; neither a retest nor a later release
   replaces the original result for reporting purposes.

Parallel QA work includes formula review/approval and per-document approvals.
Quality audits/CAPA and controlled document setup are cross-referenced to their
own modules rather than folded into one generic QA count.

## Three concepts that must stay separate

| Concept | Primary evidence | What it does not prove |
| --- | --- | --- |
| BMR document recorded as issued | BMR `IssuedDate`, issuer and associated issue evidence | QC approval, final batch release, stock issue, consumption or genuine QA origin when created by an import. |
| ATR stage released | ATR/request release event and approved stage evidence | All other stages released or the entire finished batch accepted. |
| Product batch finally quality-released | Final workflow decision plus required-stage/OOS evidence | That a BMR document was issued in the same reporting period. |

Current `GetBmrReleaseRate` filters BMRs by **manufacturing date**, counts quality
statuses `Approved` and `Available`, and calls that count `Issued`. The QA
dashboard's BMR buckets use quality status and a **creation-date** cohort. These
cannot be reconciled to an **issue-date** report by comparing the displayed totals.
This study does not change either legacy calculation.

## QA-01: BMR issued register

Question: which BMRs were recorded as issued during the chosen days, and which
of those have evidence of a QA-performed issuance? One row per BMR ID.

Local API: `GET /api/v1/report/bmr-issued` (`GetIssuedBmrReport`). Existing
`CanViewQcAndQaReport` is checked on the backend. Active actors need a department;
production actors are limited to their own production department. The dedicated
report has no write action and does not use the active issue queue.

| Field | Present source | Availability / rule |
| --- | --- | --- |
| BMR ID | `BatchManufacturingRecord.Id` | Stable row identity; hidden operational reference, not required on paper. |
| Issued date | `IssuedDate` | Present for recorded issues; may be an import-time stamp rather than a genuine QA issue event. |
| Issued by | `IssuedById` → user | Nullable; display Not recorded; never substitute logged-in user, creator or uploader. |
| Batch number | BMR `BatchNumber` | Use the BMR field; do not silently replace it from a current master or another batch. |
| Manufacturing / expiry | BMR dates | Nullable, independent of issue date; preserve stored dates. |
| Batch size | BMR `BatchQuantity` | Stored quantity; display with shared entered-value precision. |
| Unit | Linked product `BaseUoM` | Current linked unit, not an immutable issuance-time unit snapshot. |
| Product name / code | Linked product | Current labels, not issuance-time snapshots. |
| Department | Product department | Current assignment; historical reassignment needs a captured version to reproduce. |
| Issuance source | No explicit immutable source field verified | **Gap:** distinguish normal QA issue, opening/product-stock import, legacy unknown and possible reissue. |

Filters: required inclusive UTC From/To issue dates, optional production
departments. Lower bound is midnight of From; upper bound is midnight after To,
excluded. A current recorded issue is included even if its step later completed,
or the source is archived/cancelled. The policy for an issued document later
voided/replaced needs a separate explicit event/decision; do not erase it from
history by applying a generic current-active filter.

Agreed print headings and stacked content:

| Product | Batch | Validity | Issued | Department |
| --- | --- | --- | --- | --- |
| Name / Code | Number / Size and unit | Mfg / Exp | Date / By | Department name |

Each slash above represents a second line, not a flattened text delimiter.
Long content wraps. Excel/CSV retain nine independent fields: issued date,
issued by, batch number, manufacturing date, expiry date, batch size/unit,
product name, product code and department.

### Provenance decision before QA-only acceptance

`ProductRepository`'s product-stock upload constructs approved BMR/BPR records
with `IssuedDate = DateTime.UtcNow` and no `IssuedById`. Thus the local report's
current timestamp-based selection can include imported stock records. The test
fixture's missing-issuer behavior deliberately does not guess their origin.

Decide between a **recorded BMR issue register** with a source/unknown breakdown,
or a **QA-performed issue register** backed by traceable issue events. Recommended
study direction: preserve the complete register, expose confirmed import/QA/unknown
provenance, and make a QA-only view depend on genuine evidence. Do not exclude all
missing issuers (which could hide real legacy issues), or treat every creator as
an issuer. Existing activity logs may help for individual records but must be
checked for completeness and repeat-issue matching before becoming authoritative.

The normal issue writer can also overwrite the timestamp/issuer on a repeated
call. Therefore one row per current BMR does not reconstruct every issuance event.
An event-history requirement would need its own immutable event definition.

### Acceptance cases

- Issue at start midnight and final representable instant of end day included;
  previous day and midnight following end excluded.
- A recently issued BMR requested earlier is included; an approved BMR without
  issue evidence is not silently treated as issued.
- Completed step, archived product and cancelled schedule batch remain represented.
- Missing issuer/date/unit is visible; no inferred attribution or display as zero.
- Imported issued stamp, genuine QA issuance and legacy unknown remain distinguishable
  once provenance rules are agreed; a name/creator heuristic is not acceptance.
- A reissue cannot create two identical BMR rows; if event history is required,
  each event must have its own identity rather than accidental join duplicates.
- Restricted actor cannot select another production department; direct API access
  follows the same backend scope. No implicit administrator exemption.
- Report count reconciles to distinct accepted IDs; print/export contain all rows
  and the same filters/snapshot. No mixed-unit quantity total.

The existing local report tests prove date/identity/permission/print behavior,
not a complete QA-origin classifier. The provenance finding is new study work.

## QA-02: unissued request backlog

One row per requested BMR with no qualifying issue event, open at the report
snapshot. Suggested columns: request/BMR reference, product name/code, batch
number if assigned, department, requested at/by, issue-step status, waiting age,
owner if explicitly assigned and blocking reason if actually recorded.

Default current snapshot; optional department, age band and owner. A date range
may describe **requests received in period** or **issues completed in period**,
but must not silently remove older requests from the current backlog.

Age = snapshot instant minus valid request time; missing/negative times are
exceptions. A start-of-batch placeholder BMR is not necessarily an actionable QA
request until the request/step activation evidence is confirmed. Trace this
writer before finalizing the denominator. Historic snapshots require historical
issue/void/state coverage; do not reconstruct them from today's open rows.

KPIs: open actionable count, oldest valid age, age-band counts. Targets and
escalation limits need business agreement; none is assumed.

## QA-03: batch quality decisions

One row per agreed final batch decision, with product/code, batch, department,
required stage set, result/outcome, final decision date/person, source request/
response/COA/OOS reference, pinned version where available and reason.

Filter the **decision event**, not BMR manufacture or document issue. Preserve
normal release, favourable OOS disposition, rejection, quarantine and unresolved
outcomes separately. Whether a later decision supersedes a former one must be
defined with event identities, not current status alone.

Candidate KPI: released decisions divided by evaluable released + rejected
decisions in the same final-decision cohort, with pending/unknown count shown
separately. This is a proposal; users may instead want a manufacturing-cohort
release measure, which would have a different denominator and lag policy.
No final-release rate should ship until those alternatives are resolved.

## QA-04: ATR lifecycle and turnaround

One row per ATR/stage/attempt identity. `AnalyticalTestRequest` provides CreatedAt,
SampledAt, AcknowledgedAt, AssignedAt, TestedAt, ReleasedAt, IssuedAt, stage, status,
AR/issue references, people and `IsRetest`. Product, BMR and step links are explicit.
There is also a rebuilt worksheet test-request model; report source engine is
mandatory until correspondence is established.

Suggested columns: request/AR/issue reference; product/code/batch/department;
stage; attempt/retest; each lifecycle timestamp; sampled/assigned/tested/released
people; current status; specification/ARD/worksheet version where linked;
test duration and release-wait duration; linked OOS/retest reference.

Dates: choose exactly one period event in the filter. Current work-in-progress
is a separate snapshot view. Proposed durations: sampled→tested and tested→released,
only for valid matched completed pairs; show median/P90 and evaluated/excluded
counts by stage/test family. Do not average all test families into an unexplained
single turnaround. Multiple assignees/reassignments do not multiply requests.

## QA-05: approval workload and ageing

One row per required, currently actionable approval stage on a specific document
revision. Source stages have order, Required, Status, StageStartTime, ActivatedAt,
ApprovalTime, approved person and comments. Not all workflow types expose every
field to the same API, and version binding is not uniform across baseline models.

Suggested columns: document type/reference/ID, content/version identity if
available, department, request time/person, stage/order, activation time,
assigned user/role, delegated-on-behalf-of identity, decision/status/time/person,
required flag, reason, waiting age. A delegated approver is not a second stage.

Current pending age starts at the authoritative stage activation time, not
document creation, unless explicitly presenting document age. Future inactive
stages must not be overdue. Earlier revisions/decisions stay in an audit view
but cannot be counted as actionable approvals for current content.

**Observed calculation defect:** `GetQaDashboardReport` includes purchase-order
approval counts twice in each of its total, pending and rejected expressions.
It also mixes several document families. Those totals are not a reliable QA-only
approval population until ownership, per-document grants, stage grain and
deduplication are reconciled. This study does not change them.

## QA-06: OOS and QA disposition register

Legacy `OosInvestigation` exposes initiated/submitted-to-QA/QA-approved/permanently
rejected status, SubmittedToQaAt, QaReviewedAt, people, reason and narrative fields.
Worksheet `OosCaseDetailDto` additionally exposes field/test identity, observed
value/breached limit, pinned specification/version, investigated/retest-authorized/
disposition timestamps and people, original/retest worksheet references and outcome.

Suggested columns: engine/case ID; subject kind/product/material/code/batch;
test/stage/field key; opened/submitted dates; owner/reviewer; suspected/confirmed/
invalidated state; root cause; retest link; disposition/person/date; currently
blocked status; days open. Keep narrative/evidence detail under the relevant OOS
permission rather than exporting it automatically with every QA report.

Period views: cases opened, QA decisions made, or cases still open at snapshot.
Do not present an open count as a period incidence rate. Suspected cases,
invalidated laboratory results and confirmed batch failures need separate buckets.
CAPA effectiveness belongs to the linked action workflow; a narrative corrective
action is not proof of effective closure.

## Access contract to retain

| Surface | Existing observed requirement | Study implication |
| --- | --- | --- |
| QC/QA report workbench | `CanViewQcAndQaReport` | Not an automatic grant to every confidential QC/QA detail or mutation. |
| Issue BMR/BPR operational page | Some of `CanViewIssuedBmrBprs`, `CanIssueBmr` | Operational view/action requirements differ from report access. |
| QA sampling ATR queues | Some of `CanViewAnalyticalTestRequests`, `CanViewAnalyticalTestRequestsForSampling` | QC analysing queues use separate keys; keep per-choice query access. |
| Legacy OOS list | `CanViewOosInvestigations` | Submission/review decisions have separate mutation keys. |
| Formula review / approval queues | `CanViewReviewFormulaRevision` / `CanViewApproveFormulaRevision` | Separate controlled-change study; no inferred question-edit permission. |

Rebuilt QC and per-document approval permissions must be mapped from their actual
controllers before a combined report is implemented. No new grants or automatic
role assignments are introduced by this plan.

## Proposed QA review sequence

1. Resolve QA-01's issuance provenance and accept its already agreed nine fields
   / five print headings. Decide whether a BPR needs a separate register or an
   explicitly labelled companion view; do not assume BMR and BPR always coincide.
2. Agree request activation/backlog meaning and age basis for QA-02.
3. Trace final release events and agree the QA-03 cohort/denominator.
4. Confirm legacy/rebuilt QC boundaries, stage/attempt identity and duration pairs
   for QA-04, in coordination with the QC module.
5. Reconcile per-document approval ownership, duplication and activation age for
   QA-05; then review QA-06's disposition/outcome definitions.

Only after the definitions are accepted should queries/UI/KPIs be added or
corrected. The immediate study output is a reviewable specification and gaps,
not six silently implemented reports.

## Source anchors

Backend: `DOMAIN/Entities/Products/Production/BatchManufacturingRecord.cs`;
`DOMAIN/Entities/AnalyticalTestRequests/AnalyticalTestRequest.cs`;
`DOMAIN/Entities/OosInvestigations/OosInvestigation.cs`;
`DOMAIN/Entities/QcWorksheets/OosCaseDtos.cs`;
`DOMAIN/Entities/Approvals/Approval.cs`;
`APP/Repository/ProductionScheduleRepository.cs` (`CreateBatchManufacturingRecord`,
`GetBatchManufacturingRecords`, `IssueBatchManufacturingRecord`);
`APP/Repository/ProductRepository.cs` (product-stock BMR construction);
`APP/Repository/ResponseFinalApproval.cs`;
`APP/Services/QcWorksheets/QcOosBatchDisposition.cs`;
`APP/Repository/ReportRepository.cs` (`GetQaDashboardReport`, `GetBmrReleaseRate`).

Desktop: `modules/{issue-bmr,analytical-test-requests,oos-investigations,formula-reviews,formula-approvals,reports}/manifest.ts`
and the local `modules/reports/{api/issued-bmr.ts,lib/issued-bmr-sheets.ts}`,
all relative to `apps/web/src`. Source presence is not deployment evidence.
