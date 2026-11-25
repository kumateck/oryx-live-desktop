# Department production board order

Open **Settings → Production board order**, or **Board order** from the Operations linking page. Choose a production department, drag the existing table's row handles, then **Save order**. Keyboard users can focus a handle, press Space, move with arrow keys, then press Space to drop; Escape cancels a move.

For Tablet, **Use Tablet sequence** arranges the 21 named operations in the supplied manufacturing sequence. It prepares an unsaved draft for review. Operations with other names remain visible at the end in their current relative order. Nothing is silently removed. Save or reload the draft before changing departments; navigating away protects unsaved changes.

The API updates the linked operations' `Order` values together. The production board already sorts columns by these values, including empty configured columns. This setting changes board columns only; a batch's recorded procedure and activity-step order retain their existing meaning. Active historical operations outside today's linked list remain visible on the board.

`CanViewDepartmentProductionBoardOrder` controls the page, lookup and navigation. `CanReorderDepartmentProductionBoard` controls drag, the Tablet preset and Save, with a fresh check immediately before mutation. Server GET and PUT enforce those keys independently. The grant migration copies existing operation-view and operation-edit grants with their access types. A save must contain every linked operation exactly once and its reviewed version token. Changed names, links or ordering reject a stale save; the draft remains visible until the user reloads and reviews it.

The additive contract is imported with `bun scripts/import-production-board-order.ts <metadata-export.json>`, then `bun run api:generate`; generated output is never edited by hand. The navigation importer also records the new page. Where the legacy application's dependency tree is absent, the import can be run with a temporary Bun preload exposing only its actual permission-key and enum modules instead of loading its application barrel.

Validation covers permission deny/allow, exact operation sets, duplicate/foreign IDs, stale versions, unchanged recorded step order and PostgreSQL grant migration idempotency. UI coverage checks the shared draggable table, the Tablet preset, complete save payload, read-only access and stale-save recovery. Browser captures use synthetic data only. Local implementation does not change a customer's configured order until deployed and saved from the new page.
