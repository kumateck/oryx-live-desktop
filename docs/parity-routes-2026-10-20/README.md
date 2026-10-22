# Classified route ledger — 2026-10-20

Read [the audit](../implementation-parity-2026-10-20.md) and [the backlog](../parity-backlog-2026-10-20.md) before treating a row as feature parity.

Every one of the 404 Next page routes appears exactly once in the domain CSVs. Additional files list Live-only routes and navigation destinations without a concrete page. These are source classifications, not manual acceptance results.

| Ledger | Next routes |
| --- | ---: |
| [access-management](access-management.csv) | 9 |
| [audit](audit.csv) | 3 |
| [commercial-logistics](commercial-logistics.csv) | 43 |
| [finance](finance.csv) | 5 |
| [general-stores](general-stores.csv) | 39 |
| [people](people.csv) | 34 |
| [production](production.csv) | 35 |
| [quality](quality.csv) | 81 |
| [reports](reports.csv) | 21 |
| [rnd](rnd.csv) | 7 |
| [settings](settings.csv) | 61 |
| [system-dashboards](system-dashboards.csv) | 25 |
| [warehouse](warehouse.csv) | 41 |

Additional inventories: [19 Live-only shapes](live-only.csv), [77 unavailable catalog destinations](navigation-without-page.csv).

## Columns

- `area`: first Next URL segment, preserving the original route domain.
- `next_route`, `next_source`: baseline URL shape and repository-relative page source.
- `status`: classification below.
- `live_destination`: identified page, shared UI or journey replacement; multiple alternatives are explanatory, not literal redirect rules.
- `live_source`: concrete same-shape Live page source, when present. For mapped flows use the destination and the audit evidence.
- `finding`: scope, caveat or missing capability.

## Status definitions

| Status | Rows | Meaning |
| --- | ---: | --- |
| `unported` | 114 | No equivalent complete Live screen identified. |
| `same-route` | 208 | Same normalized URL shape; not complete behavioral parity. |
| `next-incomplete` | 6 | Baseline is itself broken, placeholder or no-op. |
| `mapped-flow` | 30 | Source journey moved/consolidated; old-link and detailed equivalence unaccepted. |
| `legacy-route` | 1 | ID-less edit route needs an explicit compatibility decision. |
| `partial` | 4 | Some actions exist but dedicated reviewer journey is incomplete. |
| `deferred` | 41 | Absent suite with recorded scope exclusion or hold. |

## Method

1. Recursively enumerate `src/app/**/page.ts[x]` in Next and `apps/web/src/pages/**/page.ts[x]` in Live.
2. Remove route-group directory names `(…)`; keep literal segments and replace each `[parameterName]` with one common parameter token for comparison.
3. Match unique normalized shapes, then inspect unmatched exports and their components; map domain moves/dialogs and isolate broken baseline screens.
4. Flatten path-bearing entries of the generated Live navigation catalog; retain distinct query variants and compare pathnames to concrete route patterns, excluding the catch-all.
5. Classify every baseline route once and validate row totals, uniqueness and source-file existence. Matching pages still require field/action/workflow acceptance.

Snapshot commits and test results are recorded in the audit. The inventory excludes API route handlers, layouts and loading/error components. Parent/child catalog duplicates are deduplicated by full destination. This is why page, menu, API and feature counts must not be interchanged.
