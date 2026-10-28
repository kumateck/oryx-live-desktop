# Remaining implementation and acceptance gaps — 2026-10-22

The five-domain request remains in progress. A route marked implemented-in-validation still needs deployed integration/visual acceptance; it is not evidence of production readiness. scope.csv is the route-by-route inventory.

## HR, onboarding, stores and services — now implemented in validation

The HR server prerequisites, public onboarding, the designation and leave configuration fixes, and all 27 general stores/services routes are now implemented in validation. So are `/crm/jobs/job-request` and `/formula`. The backend repair they depend on is local, uncommitted and undeployed. See [stores-services-and-hr-2026-10-22.md](stores-services-and-hr-2026-10-22.md).

- Oryx Next's onboarding and its old invite links stop working once the repair is deployed. HR must invite people again from Live, and the server needs `Onboarding:BaseUrl` set to the Live site address.
- The repair must be deployed and its three migrations run before live acceptance of these routes.

## Shared server and integration limits

- Inventory/receiving/stock integrity, contractor association/deletion and refresh-token ownership source repairs are tested locally and not deployed. The running server must include them before corresponding live acceptance.
- Stores and services controllers now check current grants per action in the undeployed source repair (stores per store type). Client permission checks do not replace that enforcement, so it must be deployed.
- Service deletion now refuses services still in use (undeployed repair). Inventory definition identity/history safeguards and receiving/damage-create integrity repairs are now in source validation; PostgreSQL integration and deployed acceptance remain. Return posting and damage edit/delete now post to the ledger in the undeployed repair. No silent compensating stock or financial change has been made to existing records.
- Shift calendar range/day reads ignore dates; Live validates/filter dates itself. The unsafe update-schedule operation is not used. Availability can conservatively exclude non-overlapping shifts; policy/concurrency enforcement still needs backend integration.
- Production transfer request/approval is implemented; warehouse issuing/receipt and stock/audit reconciliation still need end-to-end acceptance.
- Finance and report definitions have focused coverage; live approval/reconciliation/export combinations and target-screen layouts remain to verify. No real financial or HR decision has been executed in testing.
- Installed desktop quit/relaunch and shell update/restart acceptance remain pending. Source-level persistence tests do not prove the currently installed shell and server have been updated.

## Verified checkpoint

1,419 web tests pass (263 files, bounded workers). The production build and TypeScript pass, along with 54 Node checks and 9 gateway checks. Backend: 1,303 pass; the 3 failures predate this work. Route and API generation checks are current.

No commit, push, deployment or production business mutation has been performed.
