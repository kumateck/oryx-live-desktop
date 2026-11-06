# White Placebo: research and proposed Oryx workflow

Date: 2026-11-02.

Status: research baseline recorded on 2026-11-02. On 2026-11-03 the user authorised
implementation and selected the simple preparation record. See
[White Placebo preparation](white-placebo.md) for the local implementation,
permissions, deployment requirements and remaining acceptance decisions. The
recommendations and questions below preserve the original research context.

## Purpose and confirmed scope

Support White Placebo in the current application with a simple preparation and
stock workflow. Focus on this one material for now.

The supplied research conversation establishes the following business context:

- The correct material name is **White Placebo**.
- It contains no active pharmaceutical ingredient (API), according to the client
  context in that conversation. Its actual formula remains to be confirmed.
- It is prepared internally from other materials, then weighed.
- The actual output becomes stock and can be used in subsequent product BOMs.
- White Placebo itself does not require a purchase requisition. Its constituent
  materials still follow normal procurement and authorised stock issue.

The supplied document is background evidence. Its earlier proposals for a broad
intermediate-material capability are not instructions or approved architecture.
The current request prioritises simplicity and White Placebo alone.

## Pharmaceutical interpretation

For this workflow, White Placebo can be treated as an internally prepared,
stockable excipient blend used in later manufacturing. Its precise dosage form,
composition and approved manufacturing process have not yet been established.
The name alone does not determine testing, storage conditions or shelf life.

Pharmaceutical batch-record requirements provide a useful reference for keeping
ingredient batch identities, component weights, actual yield, quality evidence
and responsible people together. See [21 CFR 211.188](https://www.ecfr.gov/current/title-21/chapter-I/subchapter-C/part-211/subpart-J/section-211.188).
This is an international reference, not a determination of Entrance's applicable
local regulatory obligations.

Stored intermediate materials also need an established permitted holding period
under specified conditions. The period must come from the site's justified
process and quality evidence, not an arbitrary application default. See
[WHO TRS 992, Annex 4: General guidance on hold-time studies](https://www.who.int/publications/m/item/general-guidance-on-hold-time-studies)
and [FDA laboratory-controls questions and answers](https://www.fda.gov/drugs/guidances-drugs/questions-and-answers-current-good-manufacturing-practice-requirements-laboratory-controls).
Weighing the output does not itself authorise its use.

## What the current application supports

These findings come from local source and documentation inspection, not a live
customer-data check or an end-to-end execution of this proposed workflow.

| Existing capability | Relevance and limitation |
| --- | --- |
| Material master with Raw and Package kinds | White Placebo can participate as a material ingredient. The inspected master has no internal-preparation or purchase-exclusion setting. |
| Material-department links and units | Existing department ownership and linked stock units should remain authoritative. |
| Material batch records | Already hold batch number, quantities, manufacturing/expiry dates, quality status and stock history. They do not establish a White Placebo preparation-to-ingredient link. |
| Product BOMs | Lines reference materials; the picker reads the department's raw materials. White Placebo should fit this selection path once configured and linked. |
| Product-owned recipes | The current BOM belongs to a product. Registering White Placebo as a material does not give it a recipe or consume its ingredients. |
| Material quality controls | Approval checks the configured analysis readiness. Current material sampling requires a valid goods received note (GRN). An internal preparation needs an explicit entry into this journey. |
| Approved stock and shelf allocation | Existing usable stock queries depend on the Available batch state and warehouse stock. Recording output, quality approval and availability are distinct events. |
| Production stock requisitions and issue | Existing issue/reservation logic is reusable in principle, but its preparation linkage and approval requirements need review. Do not assume it supports this workflow unchanged. |
| Finance Costing | The documented screen manages product selling prices and customer agreements. It is not evidence of a manufacturing inventory-cost engine. |

Relevant frontend references:

- [Products and BOMs](products-migration.md).
- [Warehouse management](warehouse-management-migration.md).
- [Approved stock and shelf allocation](warehouse-stock-migration.md).
- [Receiving and quarantine](inbound-logistics-migration.md).
- [Production board and actions](production-board-migration.md).
- [Finance Costing](costing.md).
- [BOM material picker](../apps/web/src/modules/products/hooks/use-material-options.ts).

Relevant companion-backend references:

- `DOMAIN/Entities/Materials/Material.cs` and `CreateMaterialRequest.cs`.
- `DOMAIN/Entities/Materials/Batch/MaterialBatch.cs`.
- `DOMAIN/Entities/BillOfMaterials/BillOfMaterial.cs`.
- `APP/Repository/MaterialRepository.cs`.
- `APP/Repository/MaterialSamplingRepository.cs`.
- `APP/Repository/RequisitionRepository.cs`.

## Recommended minimum workflow

Keep one White Placebo material record and add a focused preparation record that
connects the ingredient batches to its weighed output. Reuse the existing
material, warehouse, BOM and quality screens where their contracts fit.

The proposed interface is one **Prepare White Placebo** screen with batch
history. Whether it uses a separate approved batch sheet or the normal BMR and
production-board journey remains an open decision.

1. **Set up the approved recipe.** Define the excipients, quantities, expected
   output and approved preparation instructions. Retain the recipe actually used
   on each preparation; later changes must not rewrite historical evidence.
2. **Record preparation inputs.** Identify the ingredient batches and actual
   quantities used, including the authorised stock-issue evidence. Prevent use of
   unavailable stock and reconcile unused issued quantities through the existing
   authorised return process where applicable.
3. **Record actual output.** Enter the White Placebo batch number, preparation
   date/time, actual net weight and unit. Show variance from the recipe's expected
   output and record explanations or investigations required by the site process.
4. **Complete quality and stock allocation.** Keep output unavailable until the
   applicable checks, release and warehouse allocation are complete. Record its
   permitted use-by/hold limit and storage conditions as established by Quality.
5. **Consume through an ordinary product BOM.** Select White Placebo as an
   ingredient, reserve/issue an eligible batch and deduct the quantity used.
   Preserve its upstream ingredient links for traceability.

White Placebo must be excluded from purchase requisitions with a backend rule as
well as appropriate picker/action behaviour. Low stock should indicate a need
to prepare more; automatic replenishment planning is outside this initial scope.
Identify the configured material by stable identity, not its displayed name.

The internal quality entry must not require staff to invent a supplier shipment,
invoice or purchase. Whether to use an explicitly identified internal receipt or
adapt the sampling entry is still a design decision; quality gates remain intact.

## Worked inventory example

These are hypothetical inventory quantities, not a pharmaceutical formulation.

| Event | Inventory result |
| --- | --- |
| Preparation consumes 10 kg of recorded ingredient batches | Those ingredient quantities leave usable inventory through the authorised flow. |
| Actual net output is 9.8 kg | Record one White Placebo batch with 9.8 kg output. |
| Expected output for this example is 10 kg | Record 0.2 kg variance and 98% yield, with the required explanation. |
| A later product batch consumes 2 kg of released White Placebo | White Placebo has 7.8 kg left, assuming no other stock movements. |

The ingredient batches are consumed once during preparation. Later production
consumes only White Placebo stock; it does not deduct those ingredients again.
Sampling, returns, rejection and other movements must also reconcile when present.
Expected output must come from the approved process; total input weight is not
automatically the expected output for every process.

## Essential controls within the small scope

- Keep the preparation, input batch quantities, actual output, people, dates and
  quality evidence linked and auditable. Support tracing from an ingredient batch
  through White Placebo to the product batches that use it.
- Preserve backend permissions, department scope, stock eligibility and approval
  gates. Map the exact existing permissions before implementation; this research
  does not establish new permission keys or grant access.
- Record stock effects once. A retry after an uncertain response must not repeat
  ingredient deductions or create duplicate output. Related posting must succeed
  together or leave a clearly recoverable, auditable state.
- Use actual net output, not expected output, as the produced quantity. A routine
  stock adjustment or opening-balance upload is not the preparation workflow.
- Preserve the department-linked base units and existing quantity-display rules.
  If holding limits are measured in hours or days, month-only date entry/display
  is insufficient; establish the required precision with Quality.
- Agree inventory valuation with Finance using ingredient costs and applicable
  processing costs. Do not invent a purchase price or confuse selling prices with
  manufacturing costs. A broad costing-engine redesign is outside this scope.

## Decisions still required

1. Does Entrance already use a separate approved White Placebo batch sheet, or
   must preparation follow the normal BMR and production-board process?
2. What are its approved recipe, expected output, physical form and instructions?
3. Who requests/issues the ingredients, records preparation and weight, verifies
   output, and performs the applicable quality release?
4. Which existing quality specifications/tests apply, and how should internal
   batches enter that process without a supplier receipt?
5. What storage conditions and holding limit apply, and which department/store
   receives the output?
6. How should Finance value the prepared stock within the current accounting flow?

The first decision determines how much of the existing production journey can be
reused. Record the agreed answers before changing architecture or implementing.

## Scope boundary and implementation gate

The recommendation is limited to White Placebo, its preparation evidence and the
connections needed for existing stock, quality and BOM consumption. A general
semi-finished-material module, arbitrary multi-level manufacturing, automatic
planning and a new manufacturing-cost engine are not proposed for this phase.

This research identifies a focused application extension, not a configuration-only
solution. No implementation, migration, permission grant, stock posting or customer
data modification is authorised by this document.

Source background: `Pharma Intermediate Research.md`, supplied from
`/Users/gigisiri/Downloads/entrance db backup for migrations/`. The conversation's
confirmed business context is distinguished above from recommendations and open
questions.
