# General inventory, available stock and receiving — 2026-10-22

Seven reference routes are implemented in validation in **Oryx Live Desktop**: inventory register/create/detail/edit, available stock, item transactions and receiving area. The damage/missing creation action is available from approved stock receipts. The separate damage register and its edit/delete flows remain pending; their legacy server corrections must be reviewed before migration.

## Contracts and fields

- Inventory CRUD uses generated `/api/v1/items` endpoints. Forms retain name/code, unit, optional category, classification (Recoverable 0 / NonRecoverable 1), active status, description, minimum/maximum/reorder levels and staged attachments. Store is selected by a permission-guarded `storeType=0..3` query and remains fixed within an editor. Backend `int` levels require non-negative whole numbers; zero is preserved. No invented ordering rule treats a zero maximum as a cap. The DTO's `hasBatch` has no matching writable entity/request property and is not presented as an editable capability.
- Details retain category, classification, store, stock, levels, unit, status, creator/time, description and original read-only attachments. A saved-file deletion uses the stored `reference`, not its different attachment record ID. File upload starts only after a confirmed saved UUID and reconciled item values. Failed/ambiguous stages retain identity and refuse replay. Reopening details forces a current read. Background refetch does not replace an unsaved editor baseline.
- Receiving/available stock uses the actual paginated response from `/api/v1/procurement/inventory/purchased-items?store=...&status=...&page=...&pageSize=...`. Published OpenAPI incorrectly declares an array; a handwritten Zod-validated adapter reads the real envelope without editing generated files. Store, status, item ID and pagination identities are verified. Normal tables remain server-paged; search reads complete bounded pages (20,000 receipts per store/status), never an apparently complete first-page subset.
- Available stock follows approved receipt rows. The same item's current balance can appear on several receipt rows and is explicitly not a summable receipt quantity. Transaction links carry store, code and item ID. Legacy code-only links resolve one scoped identity or ask the user to select a specific receipt; another store/code response never mounts the ledger query. Actual transaction dates and recorded dates are distinct; zero credits/debits/balances/holds and transaction filter zero remain visible.
- The ledger is read-only. No stock correction is silently synthesized when posted and available balances disagree.

## Permissions and workflows

Each store uses its actual `CanViewItemsIn{It,General,Equipment,Reagent}Store`, `CanCreateNewItemIn...`, `CanEditItemIn...`, and `CanDeleteItemFrom...` keys. Stock/receiving use their exact available-stock, receiving-area, approve/reject-entry and create-damage/missing keys. The manifest declares only the three stock routes beneath `/extrals`; its authenticated root does not grant access to other sibling workflows. No role-name/super-account bypass is added.

Inventory writes validate a fresh frozen record, current unit/category, complete store register, current account and callback-time permission. A second record read closes the asynchronous reference-validation window. Saved identity and all writable values are reconciled before success. Deleting visible stock is refused in the client; authoritative historical-reference checks are in the matching backend source repair.

Receipt decisions require an explicit frozen confirmation, complete current pending-register evidence, known distinct creator, positive whole-number quantity, active item, current balance, exact current permission/account and post-write stock reconciliation. The creator cannot decide their own receipt. Unknown creator identity requires audit review. Refused/ambiguous decisions cannot be replayed from the same confirmation.

Damage/missing creation requires a positive integer no greater than fresh available stock, active exact item, current store permission/account and a reconciled ledger before posting. Confirmed HTTP writes refresh stock caches immediately. The returned report identity/quantity/type, available stock and posted balance are reread; disagreement asks for inspection and never reposts the command.

## Matching backend source repair (not deployed)

`docs/inventory-stock-integrity.md` in Oryx Backend describes the authoritative changes and tests:

- Current database grants govern item CRUD/read and receiving decisions. Removed anonymous item/ledger reads. No cached or role-name bypass. Receipt decisions require a distinct known creator.
- Definition validation verifies enums, units/categories, integer levels, scoped name uniqueness and globally unique newly assigned codes. The global code restriction is necessary because the legacy ledger stores only code. Existing cross-store historical collisions are refused for ledger reads/posting until reconciled; no historical code is rewritten or invented item identity attached to a log.
- Referenced code/store/unit/classification cannot change; stock/current and historical vendor, purchase, issue, shipment, damage, return and job references prevent item deletion. Definition checks and writes use a serializable transaction on relational providers, with conflicts returned for review and no automatic mutation replay.
- Approval retains the original receipt quantity, requires Pending and posts one stock/ledger credit. Rejection cannot change an approved/rejected entry. Damage creation writes report/stock/debit in one SaveChanges transaction.
- Existing status/balance/identity columns are optimistic concurrency tokens, with controlled conflicts for competing decisions and stock writes. No new database column or data migration is introduced. Production PostgreSQL transaction/serialization acceptance still needs verification; EF InMemory tests do not prove database locking/rollback behavior.

## Verification and outstanding acceptance

Focused frontend: **353 tests / 15 files pass**, covering the new modules plus existing vendor/service and route checks. Backend: **51 isolated tests pass**, including actual receiving-controller exact-store/maker-checker restrictions, cross-store code collisions, stale decisions and stale stock writes. Full-suite/build results are recorded in the progress index after completion. All tested business mutations use stubs or isolated EF contexts.

The local desktop at `http://127.0.0.1:5173/` still reaches a customer-server error while restoring the session. No fresh sign-in loop, real stock write, approval, deployment or shell restart was used to claim acceptance. Signed-in visual/layout checks at target sizes, PostgreSQL concurrency/rollback, historical-code reconciliation and end-to-end stock/audit acceptance remain. The older return and damage edit/delete source defects are still explicitly pending, as are the remaining purchasing, issue, return and job workflows.

Documentation updated: this file, scope.csv, progress index, remaining-gaps.md, Live services/workflows, and backend inventory-stock-integrity/services/workflows.
