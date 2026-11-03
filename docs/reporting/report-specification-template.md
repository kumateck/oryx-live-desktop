# Report specification template

Copy for an agreed report. A populated template records a decision; its presence
alone does not authorize implementation or prove that data exists.

## Identity and decision

- ID / business module / title:
- Business owner / audience:
- Question answered / action supported:
- Priority and acceptance status:
- Existing workbench option, backend query, local feature or new proposal:

## Data contract

- One row represents:
- Stable row key / parent-child keys / permitted drill-through:
- Authoritative source entities and exact query:
- Inclusion/exclusion: statuses, archival, cancellation, retests, replaced versions:
- Event timestamp or snapshot basis / time zone / inclusive date semantics:
- Historical coverage start / current labels versus event-time snapshots:
- Department/site/ownership scope and backend permissions:

| Column | Meaning | Source field or calculation | Unit/currency | Missing value | Confidential? |
| --- | --- | --- | --- | --- | --- |
| To agree | | | | | |

| Filter | Required/default | Applies to which event/field? | Scope/validation |
| --- | --- | --- | --- |
| To agree | | | |

## KPIs and reconciliation

| Measure | Numerator | Denominator | Period/cohort | Grouping/exclusions | No-data behavior | Reconciles to |
| --- | --- | --- | --- | --- | --- | --- |
| To agree | | | | | | |

- Targets/threshold owner and approved baseline, if any:
- Multi-unit/currency totals and conversion evidence:
- Duplicate prevention and header/line reconciliation:
- Exception counts and reasons records cannot be evaluated:

## Presentation

- Screen columns and row detail:
- Print headings and grouped first/second lines:
- Independent Excel/CSV columns and complete export behavior:
- Header: scope, dates/basis, generated time, totals and caveats:
- Empty/error/permission/cancelled generation behavior:

## Acceptance and outstanding work

- Hand-worked sample, operational documents and expected rows/totals:
- Date boundaries, missing evidence, archived/cancelled records, state changes:
- Cross-department denial and confidential export checks:
- Pagination completeness / duplicate identities / source changes during generation:
- Performance on realistic data; indexes/limits only after measurement:
- API compatibility, deployment prerequisites and customer acceptance:
- Unresolved decisions, data gaps and owners:
