# Final packing yield

Reviewed against Oryx Next and the customer-provided packaging-yield forms on 2026-10-27.

## What Next implements

The Next implementation is under `src/components/pages/production/final-packing/`:

- `yield.tsx` defines category-specific unit labels but includes a received-weight entry for syrup.
- `type.tsx` requires that received measurement for every category.
- `index.tsx` derives weight-based expected counts from received kg and average mg, rounding to a whole unit. Syrup keeps the packing style's configured expected yield. The user confirmed that this preload is intentional for syrup; its average bottle volume must also preload from the product composition unit.
- The entered actual quantity is a gross count. Samples are subtracted to produce warehouse quantity and shippers. Next also subtracts those samples before calculating gain/loss, so a sample appears as a production loss.
- Packing material reconciliation is a separate balance. Its raw quantities, returns and audit behavior must remain separate from finished-product counts.

Live preserves the useful category labels, whole-unit rounding, sample categories, shipper breakdown, material conversions and variance explanation at an absolute variance of 2% or more. It corrects the received measurement and gain/loss behavior below.

## Measurement and accounting rules

| Packing category | Basis for expected count | Counted unit |
| --- | --- | --- |
| Syrup | Preloaded selected packing-style expected yield | Bottle |
| Tube | Received gel weight in kg, converted to mg / average unit weight in mg | Tube |
| Capsules | Received capsule weight in kg, converted to mg / average capsule weight in mg | Capsule |
| Tablet | Received tablet weight in kg, converted to mg / average tablet weight in mg | Tablet |
| Dry powder | Received granule weight in kg, converted to mg / average filled-unit weight in mg | Bottle |
| Sachet | Received sachet weight in kg, converted to mg / average unit weight in mg | Sachet |

The average and bulk measurements must use a consistent product-weight basis. Outer-container tare must not be mixed into only one side of the ratio.

Syrup has no received-weight or received-volume entry. Its three reference values are preloaded and read-only, as clarified by the user on 2026-10-28:

- Batch size is the product's **full batch size** (`product.fullBatchSize`), displayed in litres. It is not the schedule's bottle count or a half-batch override.
- Average filled volume per bottle is the product's **composition unit** (`product.baseQuantity`), displayed in ml.
- Expected yield is the selected packing style's **configured expected yield**. Live must not replace that value with a calculation or ask the user to type it.

Volume quantities are stored in ml. The UI and backend both recognize a syrup product declared by product/style category, or a legacy generic bottle style on a volume-based product. A declared non-syrup category takes precedence over the volume fallback. An unidentified non-volume category blocks the form instead of inventing a received-quantity entry. Missing syrup reference data also blocks saving and asks staff to correct product/style setup.

This preloaded behavior applies **only to syrup**. All other five categories retain editable received-weight and average-weight inputs and their existing weight-based expected-count calculation.

All finished-unit and sample entries are whole, non-negative counts. The form explicitly asks for **total quantity packed including samples**:

```text
samples = QC analytical + retained + stability/registration
warehouse quantity = total packed including samples - samples
gain/loss = total packed including samples - expected count
variance % = gain/loss / expected count * 100
full shippers = floor(warehouse quantity / units per shipper)
leftover units = warehouse quantity % units per shipper
```

Weight-based expected count is rounded to the nearest whole unit, preserving Next's positive-number rounding convention. Missing weight measurements do not fall back to a configured style count. Syrup uses its preloaded configured count unchanged. Samples must leave a positive warehouse quantity, preserving the existing workflow restriction. A reason remains mandatory at either the positive or negative 2% boundary. Small non-zero variances use the shared calculated-quantity formatter instead of rounding to zero at two decimal places.

Example setup: full batch 3,000 L, composition 150 ml, configured expected yield 20,000 bottles. All three values preload read-only. If total packed is 20,025, with 3 QC and 12 retained samples, warehouse quantity is 20,010 and gain is 25 (0.125%). For 50,000 total bottles with 3 samples and an expected count of 50,000, warehouse quantity is 49,997 and gain/loss is zero.

## Existing API and backend companion

No generated DTO, OpenAPI declaration or database migration changes are needed:

- `yieldTotalQuantityPacked` carries the gross count including samples.
- `totalNumberOfBottles` and `totalQuantityPacked` carry the net warehouse quantity.
- `totalGainOrLoss` compares the gross count with expected count.
- The legacy decimal `totalWeightReceived` is 0 for syrup, representing no measured received weight. Weight-based forms still require a positive received value in kg.

The companion backend persists the existing `FinalPacking.ExpectedYield` property when creating or updating a recognized packing category. For syrup it reloads and saves the product full batch size, composition volume, and configured style yield, ignoring manually supplied replacements and normalizing received weight to 0. The other five categories retain their received-weight/average-weight calculation. Invalid setup or required measurements are refused before saving or completing the step. Older unrecognized non-volume styles keep their existing backend behavior; Live refuses unsupported categories before writing.

Deploy that backend correction with Live to retain expected yield on read-back. On older backends, the current form can still calculate yield, but a saved expected count may remain 0 and is shown as “Not recorded.” Existing packing records and their historical gain/loss values are not rewritten.

## Workflow boundaries

The active step, assignment, permissions, issued packaging baseline, extra-material issue gate and existing packing record are reread before saving. Permission is checked again immediately before the packing and return writes. The save/return sequence, ambiguous-outcome handling and retry behavior remain intact.

The backend transaction/idempotency/authorization limitations already documented in [production board migration](production-board-migration.md#backend-requirements-for-final-packing) are separate from this calculation correction and remain outstanding.

Verification covers generic/missing syrup packing-unit names, product category and volume fallbacks, read-only preloads that differ from scheduled quantity, configured yield preservation, missing setup, stale composition before saving, all weight categories, exact variance boundaries, gross/net payload mapping, backend canonical preloads/create/update/read-back and unchanged workflow guards. Changes are prepared locally for manual review and push.
