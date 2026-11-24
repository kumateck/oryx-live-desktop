# Clear a saved density

Open Warehouse → Linked materials → the material’s Change stock levels action, then choose Clear density. Confirm to save its shared density as null. Clearing remains available for legacy density units. The stock-level dialog stays open so unsaved level edits remain available; clearing the measurement field alone never deletes saved density.

The confirmation states that density is shared across departments. Existing stock and density captured on reservations/transfers are retained, while future mass/volume conversion needs a verified density. A refused clear stays open with the server reason. The list and stock readers refresh after a successful clear.

The raw and packaging actions use the existing `CanEditRawMaterialDensity` / `CanEditPackagingMaterialDensity` permissions, with a fresh check immediately before each request. The server independently checks the stored material kind and actor grants. No new permission or automatic grant.

Deploy the companion backend and `AllowClearingMaterialDensity` migration before this UI. Import only the raw/packaging DELETE endpoints with `bun scripts/import-clear-density.ts EXPORT.json`, regenerate, then check. Reviewed source digest `c0e8c054c821a04e2e8fba72260a09bbaac721eebe81999654944c72c2655f67`; removing those two paths restores pending-COA contract `0ea14c2c…4382`.

Backend review: https://github.com/kumateck/oryx-backend/pull/1945. The production web build and fifteen focused material UI regressions and all workspace typechecks passed, as did 45 additive contract-review checks and generated API checks. The actual confirmation and retained form were checked at 1366×768, 1280×720, 1024×576 and 854×480. Publishing requires the complete exact-commit Docker release validation; no deployment was performed.
