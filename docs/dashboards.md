# Dashboards

Every dashboard of Oryx Next is rebuilt on one kit (`apps/web/src/shared/dashboard`) and lives in
`apps/web/src/modules/dashboards`. Each has its own manifest, so each is gated by the permissions the
sidebar shows it for. Nothing was added to the backend.

| Dashboard | Route | File |
| --- | --- | --- |
| Overview (home) | `/home` | `components/shell/workspace-overview.tsx` |
| HR | `/hr-dashboard` | `hr-dashboard.tsx` |
| HR executive summary | `/hr-executive-summary` | `hr-executive-summary.tsx` |
| QC, QA | `/qa-qc-dashboard/qc`, `/qa-qc-dashboard/qa` | `quality-dashboards.tsx` |
| Warehouse | `/warehouse-dashboard` | `warehouse-dashboard.tsx`, `warehouse-scope.tsx` |
| Inventory command centre | `/inventory-command-center` | `inventory-command-center.tsx` |
| Procurement | `/procurement-dashboard` | `procurement-dashboard.tsx` |
| Logistics | `/logistics-dashboard` | `modules/logistics-dashboard` |
| Production health | `/production-health-dashboard` | `production-health-dashboard.tsx` |
| Services, Stores | `/services-dashboard`, `/stores-dashboard` | `services-stores-dashboards.tsx` |
| Finished goods | `/fgtn-dashbord` | `fgtn-dashboard.tsx` |

## The kit

- `DashboardHeading`: title, "updated … ago" from the reports' own timestamps, period switch, refresh.
- `DashboardState`: skeleton, a full error only when nothing loaded, "nothing to show" when every report is empty.
  With some reports missing the page still shows, and each card says what it could not load and offers Retry.
- `MetricTile`, `DashboardCard`, `BarList`, `Breakdown`, `Split`. Charts are bar lists: readable by a screen
  reader, and no chart library is shipped.
- `report-values.ts`: lenient zod readers (a missing figure is zero, a malformed report is empty), sums,
  averages, `compactNumber` (from a million upwards) and `plural`.
- The arithmetic of each dashboard is in `lib/*-kpis.ts`, away from the markup, and is unit tested.

## What changed from Oryx Next, and why

- **No invented figures.** The HR dashboard showed a hard-coded 99% attendance, a 65/35 gender ratio, a
  12/18 leave usage pie, a made-up turnover trend and a "visitors by weekday" chart. Attendance now comes from
  the report (and says so when none was recorded), the gender ratio from the HR KPI report, and the made-up
  charts are gone. Turnover and leave utilisation are on the executive summary, from real reports.
- **No filters that do nothing.** The finished goods "source department" and "warehouse department" chips,
  the production "division" select and the QA/QC "record type: product" chip never reached a request. They are
  not offered. QA/QC keep the material type filter, which is the part that did.
- Overtime requests showed the *leave* rejected count; the report has no rejected overtime figure, so the
  card shows expired overtime requests, which it does have.
- The inventory "value at risk" note names the chosen inactivity threshold instead of always saying 90 days.
- A total the server returns as zero is made up from its parts, as before.
- Quantities in different units are never added together (expiry risk lists each unit).
- On QC, someone in a production department sees the inspection backlog of their own department; the
  department select is locked and the department list is not requested.
- Tiles link to the list they count where that list exists in the desktop.
