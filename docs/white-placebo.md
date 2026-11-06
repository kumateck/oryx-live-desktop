# White Placebo preparation

Status: local implementation, 2026-11-03. The user selected a simple preparation
record instead of the full BMR and production-board process. This extends the
[research](white-placebo-research.md) for White Placebo alone.

## Staff workflow

Open **Production Planning → White Placebo** in the relevant production department.

1. **Recipe**: select the dedicated White Placebo material already linked to the
   department, enter the site's approved recipe reference and instructions,
   constituent excipients and quantities, expected output, storage conditions and
   Quality-established holding period in hours. Quantities use each material's
   linked weight unit; mg/g/kg entry preserves the underlying amount. Saving a
   recipe records the site's approved reference; it does not perform pharmaceutical
   formula approval. No example formulation or holding period is seeded.
2. **Prepare White Placebo**: enter the batch number, expected output, source batch
   and shelf quantities for every ingredient. Explain departures from the scaled
   recipe. The record snapshots the recipe and creates an ordinary raw-stock
   requisition using the existing `RawStockRequisition` approval configuration.
   No stock is consumed yet and this request does not reserve stock.
3. **Issue ingredients**: after approval, an authorised warehouse issuer opens the
   preparation and confirms issue. All ingredient batches, dates, quantities,
   existing reservations and source shelves are checked again. The selected
   quantities are consumed once into this preparation, with bin-card entries,
   consumption events and the existing stock-issue signature/check record.
4. **Record weighed output**: record actual positive net weight, actual preparation
   date/time and weighing/yield-variance notes. The batch enters **Quarantine** with
   an explicitly identified **Internal production** receipt. It does not create a
   supplier, purchase, shipment or invoice. Its use-by timestamp is the recorded
   preparation time plus the recipe's holding period.
5. **Quality and shelves**: use the existing material sampling, configured tests,
   approval and shelf-allocation journey. The preparation links to its internal
   receipt. Only eligible released stock is available for later production.
6. **Product BOM**: choose White Placebo through the existing raw-material picker.
   Subsequent production consumes White Placebo stock. Its constituent ingredients
   are not deducted again.

History is paged and searchable by batch number or recipe reference. The detail
record retains ingredient lot identities, quantities, recipe revision, instructions,
request notes, weighing notes, issuer/recorder IDs and timestamps. Existing stock
request screens link to the owning preparation; White Placebo issue is performed
there rather than through the scheduled-product issue action.

## Access

All White Placebo screens and service actions require an active user in their own
production department and `CanViewWhitePlacebo`. Each task then has its own key,
checked by `[Authorize]` on the endpoint and again inside the service before and
just before saving. No role receives these keys automatically; grant them in Roles.

| Action | Additional permission key | Catalog location |
| --- | --- | --- |
| View recipe, history and preparations | — (`CanViewWhitePlacebo`) | Production → White Placebo |
| Set up or revise the recipe | `CanEditWhitePlaceboRecipe` | Production → White Placebo |
| Request ingredients | `CanRequestWhitePlaceboIngredients` | Production → White Placebo |
| Issue ingredients | `CanIssueWhitePlaceboIngredients` | Warehouse → Issue Stock Requisitions |
| Record output and its internal receipt | `CanRecordWhitePlaceboOutput` | Production → White Placebo |
| Open the receipt through Warehouse | `CanViewQuarantineRawMaterials` (existing) | Warehouse |

A preparation's ingredient request appears in stock-requisition lists and detail
only for users with `CanViewWhitePlacebo` in the owning department. The earlier
draft reused shared requisition keys (`CanViewRawMaterialRequisitions`, etc.);
those no longer open White Placebo.

Approval assignees, QC testing/release and stock allocation retain their existing
permissions and configured workflows. The stock request follows the existing
approval policy, including its explicit automatic-approval behaviour where the
site has no applicable approval stages. Review the site's configuration before use.

## Integrity and failure handling

- One White Placebo recipe is configured per production department. Its material
  identity cannot be replaced after configuration. Initial configuration requires
  a dedicated material without existing batches or non-rejected purchase history.
- The material has the backend-owned `IsWhitePlacebo` marker. Purchase creation
  and edits refuse it, and the purchase picker omits it. BOM selection retains it.
- Recipe revisions are checked on save and preparation creation. Existing records
  retain their snapshots when a recipe changes. Background refresh does not reset
  an edited form or silently replace its starting revision.
- A preparation's ingredient request cannot be edited or deleted separately.
  Issue also checks that its approved lines still match the preparation inputs.
- Issue and output posting each run in a database transaction at serializable
  isolation. Shelf quantities, batch consumption and preparation transitions have
  concurrency checks. A conflict returns 409 and requires rereading the record.
- Creation uses a stable client-generated request ID. An identical retry reads the
  same result; a changed payload under that ID is refused. Repeated issue and an
  identical output retry do not repeat the inventory posting. Recorded output
  cannot be overwritten. After an uncertain response, inspect the saved record
  before starting another request, especially after leaving or reloading the form.
- Failed saves keep form values. Each mutation checks current permissions on the
  server; final write boundaries also recheck the actor's department and access.
- Generic batch creation refuses White Placebo output without a linked preparation.
  Its batch expiry cannot be extended past the recorded holding limit through a
  generic update or retest path. Existing stock eligibility also checks expiry.

All ingredient quantities issued by this initial workflow are treated as consumed
by the preparation. It does not add partial ingredient returns, extra-ingredient
requests, rework, zero-output failure closure or post-issue cancellation. Do not
represent unused ingredients as consumed or invent positive output to close a
failed batch; these exceptions need an explicitly agreed, audited reconciliation
before operational use. Manufacturing-cost valuation is not added: the existing
Finance Costing screen manages selling prices, and no fictitious purchase price
or zero manufacturing cost is posted by this feature.

## Deployment and acceptance

The companion backend adds four preparation/recipe tables and the default-false
material marker through migration `20261106080000_AddWhitePlaceboPreparation`. It also adds the
typed `/api/v1/white-placebo` endpoints and an optional preparation ID on requisition
responses. The desktop imports only these owned schemas/paths and the additive
material/requisition fields, then regenerates its materials transport normally.
Existing generated output is not edited by hand.

Apply the reviewed backend migration and deploy the matching backend before the UI
is activated. Recheck the deployed API contract and compatibility fingerprint under
[API code generation](api-codegen.md) and the customer release process. This local
work does not apply a migration, deploy, grant permissions, create a recipe in a
customer database or post stock.

Before operational use, Production, Warehouse and Quality must supply the actual
approved recipe and process, confirm department/store ownership and staff grants,
verify holding-time precision and quality specifications, and resolve the exception
and valuation limitations above. Native Windows scaling, a real database concurrent
issue/retry test and the site's full QC/shelving/next-BOM journey remain acceptance
checks; in-memory tests and local browser fixtures do not establish those results.
