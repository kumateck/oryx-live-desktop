# Warehouse and certificate queue visibility

The issue stock requisition page has a searchable product filter above the table.
Options show product code and name and come from the full permitted store queue,
independently of its current page or selected product. Raw/packaging and
awaiting/issued/all remain separate. Requests are filtered on the server before
pagination, ordered by creation time ascending with an ID tie breaker. Clearing
Product returns to all products. Changing a queue or material kind clears Product.

The raw and packaging queue reads use the existing backend permissions
`CanViewRawMaterialRequisitions` and `CanViewPackagingMaterialRequisitions`.
The server reloads grants and derives the store department from the actor.
No permission is newly granted. Issue mutations retain their separate issue keys.

Pending certificate approvals identify product name/code, batch and test stage,
or material name/code and batch. The backend enriches only records already in the
actor's permitted approval queue, using bulk subject lookups. Stock-adjustment
approval details give each line's note a separate labelled column.

ATR lists show a COA status independently of testing status: Not generated,
Partially generated, Pending approval, Approved or Revision required. Multiple
required chemical/microbial tracks must all be generated/approved before the
combined status claims that state. A draft response alone is not a generated COA.
Older backends without this field show Not reported.

The companion backend must be deployed before this UI. Import only the two queue
reads, owned queue DTO and optional approval/ATR fields with
`bun scripts/import-warehouse-visibility.ts EXPORT.json`. Regenerate with
`bun run api:generate`, then `bun run api:check`. Reviewed source digest:
`ac2f9bb848dbf7bfac8288eed035c43d3c15f1a7a35d699818b33169e48d4d49`.
Removing only these additions restores the merged pending-COA contract `0ea14c2c…4382`. Removing only pending-COA additions restores the independently reviewed queue contract `c0869629…65b3`.
This source review does not approve a customer deployment fingerprint.

The RMG001/RMG002 data correction is a separately guarded, evidence-producing
operation. See [material identity repair](rmg001-material-identity-repair.md).

Validation: 36 focused frontend tests, a production web build, all workspace typechecks, 44 additive contract-review checks, current generated API output, and React Doctor with no findings. Source components passed visual checks at 1366×768, 1280×720, 1024×576 and 854×480 without window overflow. Publishing requires the exact-commit Docker customer-release validation; its result is recorded in the pull request. No deployment was performed.

Companion backend: https://github.com/kumateck/oryx-backend/pull/1942.
