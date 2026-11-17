# Analytical Test Request form (Annexure QAD/SOP/046/F02-04)

QA's paper "Analytical Test Request – Product" is reproduced from the request's own data, to read and print beside the certificate. Added 17 November 2026: desktop #264, backend #1860.

## Where it appears

- **ATR results page:** in the certificate dialog, below the certificate.
- **Certificate approval page:** below a product certificate. A material certificate has no test request.

Each shows the form and a **Print request form** button, which opens the standard print preview.

## Layout and sources

Component: `shared/qc/atr-request-form.tsx`. It reads `AnalyticalTestRequestDto`.

| On the paper form | From |
| --- | --- |
| Intermediate / Bulk / Finished tick | `stage` (0, 1, 2) |
| Liquid, Granules, Compressed tablets, Filled capsules, Ointment, Coated ticks | `state.name`, matched by name |
| Date | `createdAt` |
| Name of product, Batch No. | product name and code, BMR batch number |
| MFG. / EXP. date | `manufacturingDate`, `expiryDate`, as month and year |
| Filled volume / filled weight / compressed weight | `filled` |
| Pack style | the schedule product's packing name |
| Prepared by (Production) and date | `createdBy`, `createdAt` |
| Sampled by (QA) and date | `sampledBy`, `sampledAt` |
| Number of containers sampled, sampled quantity | `numberOfContainers`, `sampledQuantity` |
| Received by | `acknowledgedBy`, `acknowledgedAt` |
| Released by Manager QC, released date | `releasedBy`, `releasedAt`, with the stored signature |
| Approved by Manager QA | Left blank to sign by hand: Oryx records no such approval |

The annexure number lives with the other company details in `shared/print/company.ts` (`documents.productTestRequest`).

## Server data

- `GetAnalyticalTestRequest` now returns the **pack style** (`ProductionScheduleProduct.ProductPacking`) and the **product state**. This also fills the certificate's "Pack style", which showed "–" before.
- The state is loaded on its own after the request. `StateId` is required, so an `Include` would be an inner join, and a request whose state row is missing would disappear.
- `GetAnalyticalTestRequestByActivityStep` returns the same full request. The approval page uses it because approvers hold `CanViewPendingApprovals`, which that endpoint accepts.

## Permission

`CanPrintProductAnalyticalTestRequest` (Quality Control › AnalyticalTestRequestProducts) guards the print button.

Migration `20261117050000_GrantPrintProductAnalyticalTestRequest` grants it, with the same access types, to every role holding `CanCheckProductTest` or `CanViewPendingApprovals`: the roles that can open either page.
