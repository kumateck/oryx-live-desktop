# Supplier purchase-unit symbols

Purchase unit is the supplier/material price denomination. It is stored as
`purchaseUnit`, a symbol, consistently with pricing agreements and quotation
responses (`priceUoM`). It does not replace the inventory/production quantity unit.
The legacy `uoMId` remains a compatible quantity reference for existing consumers.

## Selection and persistence

`GET /api/v1/material/{materialId}/purchase-units` returns `UnitOfMeasureDto[]`
from active material/unit links across all active departments, including zero-stock
links. The endpoint is authenticated and read-only. Symbols are trimmed and
deduplicated without regard to case. The existing department-specific `/uom`
endpoint retains its behavior for stock consumers.

Every linked family contributes options: mass `mg`, `g`, `kg`; volume `ml`, `L`;
counted units contribute their linked symbols. Duplicate symbols appear once.
A saved purchase symbol remains selected, including during loading or failure.
Without a saved symbol, a single linked unit becomes the default; multiple linked
symbols require a choice. Changing the material resets dependent selections.
Failed lookups expose a retry. An absent saved choice stays visible as a disabled
retained option. Fresh lookup validation runs before supplier save, followed by a
permission recheck. Backend validation remains authoritative.

Create/update requests send `associatedManufacturers[].purchaseUnit`. New clients
do not send a unit collection ID as their price denomination. Legacy ID-only
requests remain supported and derive a symbol. All manufacturers for one
supplier/material must share the symbol. Removed supplier associations are
soft-deleted and excluded from subsequent reads.

## Synchronization and approvals

Supplier edits, pricing agreements and quotation responses use the same symbol.
With no effective standing agreement, a valid unit edit updates the supplier
symbol directly. Where a standing agreement uses another compatible unit, supplier
edits submit an equivalent-price revision through the existing agreement workflow:
20 per kg becomes 0.02 per g. Quotation responses use their actual quoted price
when submitting that revision. These changes require contract-management authority.
They take effect on approval under the configured workflow; the supplier retains
its current unit and exposes `pendingPurchaseUnit` while approval is pending.
Rejection preserves the current default and price.

Direct agreement proposals synchronize the default on activation. Future-dated
approved agreements become the effective read value when their start date arrives.
Supplier detail/association queries and pricing caches refresh after mutations and
approval decisions. An unrelated supplier edit can keep the current unit while a
revision is pending. Conflicting pending changes and ambiguous active agreements
are refused for reconciliation.

Existing quotation prices are transaction snapshots. Awarded/closed lines cannot
be edited; approved unit changes never relabel historical quotes, purchase orders
or stock. New quotation entry defaults from effective pricing, then the supplier
symbol. Quantity/price compatibility is checked on both client and server.
Mass-to-volume conversion (kg to L) still requires a material-specific density
feature and is refused where the units cannot be reconciled.

## Release and verification

Deploy the backend migration `20261024143000_AddSupplierPurchaseUnitSymbol` and
API before releasing this frontend. The migration adds a nullable symbol and
backfills existing unit symbols, retaining quantity references. It does not modify
prices or inventory quantities. Review unresolved legacy units and overlapping
agreements before rollout. No production migration or deployment was performed.

The versioned OpenAPI contract includes the additive endpoint and symbol fields;
transport hooks were regenerated with `bun run api:generate`. Verify with
`bun run api:check`, the supplier/quotation/cache tests, TypeScript and web build.
Backend coverage includes department unions, duplicate symbols, symbol-only
create/edit reloads, equivalent-price proposals, approval/rejection, contract
permissions, pending conflicts, future dates and historical quotation protection.
EF model and migration SQL checks run without applying a database migration.

Documentation updated: this note, supplier migration notes, services, workflows,
API generation notes and README; corresponding backend rollout notes are linked
from its README, services and workflows.

Final verification: 48 frontend tests and 60 focused backend tests passed.
Strict TypeScript, the production web build, API-generation consistency and EF
model/migration SQL checks passed. The build retains its large-chunk warning;
React Doctor retains one maintainability warning for conditional form states.
The source UI detector found no regex findings (not a full rendered-page audit).
A local sample preview confirmed saved kg, distinct mg/g/kg/ml/L options, and the
pending-approval message. Temporary preview files were removed. No live ERP write
or deployment was submitted.
