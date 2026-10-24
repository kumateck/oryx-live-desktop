# Inbound logistics: from a sent order to stock in quarantine

Frontend-only. No backend change. Rebuilt from `oryx-next` (`logistics/*`, `procurement/material-distribution`, `warehouse/receiving-area`, `warehouse/grn`).

## The flow

1. **Shipment invoice.** The supplier's invoice is recorded against one or more sent purchase orders.
2. **Shipment document** (foreign) or **waybill** (local). The delivery is created for an invoice and moved through its stages.
3. **Billing sheet** (foreign only). What it costs to clear the goods: container, free time, charges. Approved, then paid.
4. **Material distribution.** An arrived, approved delivery is shared between the departments that asked for it.
5. **Receiving area.** Each material is checked in with a checklist and its batches, then put on a goods received note.
6. **Quarantine area.** The note's batches wait for quality control. Putting them on shelves is the distributed area, see [warehouse-stock-migration.md](warehouse-stock-migration.md).

## Pages and permissions

| Page | Route | View | Act |
| --- | --- | --- | --- |
| Shipment invoices | `/logistics/shipment-invoices`, `/create`, `/:id` | `CanViewShipmentInvoice` | `CanCreateShipmentInvoice` |
| Shipment documents | `/logistics/shipment-documents`, `/create`, `/:id/details` | `CanViewShipmentDocument` | `CanCreateShipmentDocument`, `CanChangeShipmentDocumentStatus` |
| Waybills | `/logistics/waybill`, `/create`, `/:id/details` | `CanViewWaybill` | `CanCreateWaybill`, `CanChangeWaybillStatus` |
| Billing sheets | `/logistics/billing-sheets`, `/create`, `/:id`, `/:id/edit` | `CanViewBillingSheet` | `CanCreateBillingSheet`, `CanEditBillingSheet` (edit, add charges), `CanDeleteBillingSheet`, `CanRecordPayment` |
| Material distribution | `/procurement/material-distribution`, `/:id/details` | `CanViewMaterialDistribution` | `CanDistributeMaterial` |
| Receiving area | `/warehouse/receiving-area?status=0\|2\|4`, `/:id/create-checklist`, `/:id/view-checklist` | `CanViewRawMaterialsItems` / `CanViewPackagingMaterialsItems` | `CanCreateChecklistForRawMaterials` / `…Packaging…`, `CanCreateGrnForRawMaterials` / `…Packaging…` |
| Quarantine area | `/warehouse/quarantine-area`, `/:id/details` | `CanViewQuarantineRawMaterials` / `CanViewQuarantinePackagingMaterials` | – |

A page reached by its address is held to the same permission and the same state as the button that leads to it.

## What each page does

### Shipment invoices
Choose the supplier, then the orders; each line starts at what is left to invoice. A line may be left off. Less than what is left needs a reason. Quantities are typed in the largest unit and stored in the line's own.

### Shipment documents and waybills
Created for an invoice not yet on a delivery (foreign invoices on shipment documents, local on waybills), with the shipping papers. The document is created first and the papers attached second; if the upload fails, retrying only attaches, so the document is never created twice.

Stages are taken one at a time, in order, each after a confirmation: New → At port → Cleared → In transit → Arrived for a shipment; New → In transit → Arrived for a waybill. A shipment stays at port until its billing sheet exists and is approved.

### Billing sheets
- **Create** for the invoice of a shipment that is not yet cleared and has no sheet. Opened from a shipment, the invoice is already chosen.
- **Number** is generated automatically using the existing desktop code generator and the configured `BillingSheet` prefix, naming style and length. Its sequence counter comes from the billing-sheet list's `totalRecordCount`, matching Next. The field remains editable; Generate again reads a fresh count, and failed reads show Retry without inventing a zero count.
- **Free time** is entered as days. The date it ends and the date demurrage starts follow from the arrival date and are never typed.
- **Charges** use one currency selection for all rows being entered, starting at the supplier's on creation or the sheet's existing currency when adding a batch. Changing it applies to every row in that submission. Selected charges stay visible on their own row and are filtered out of the other pickers; changing or removing a row makes its charge available again. Add charge is disabled while collections load or all available row slots are in use. Duplicate-charge and required-currency validation remain in place. The API still receives `currencyId` on every charge. Existing saved charges retain their currencies; totals remain grouped per currency.
- **Approval**: a new sheet waits for approval. Until then it cannot be edited, added to or paid, which is the server's rule; the page says so rather than letting the request fail.
- **Record payment**: tick the unpaid charges, give the date, the method and a reference for each. Each charge is paid in full. A payment may itself wait for approval; the charge then shows "Payment awaiting approval" and is not offered again.
- **Edit** changes the sheet's details only. The invoice and supplier are sent back as they are, because the server replaces every field.
- **Delete** is refused once a payment is recorded or waiting against the sheet. The server would allow it.

### Material distribution
Lists deliveries that have arrived and still have something to share out. The shares are the server's: each department that asked for a material receives it in proportion to what it asked for. The page shows them; **Distribute** confirms one material after a dialog that shows the shares and, when more than one department asked, asks which department's store receives the goods.

### Receiving area
One list per stage (pending, checked, distributed), raw or packaging.

- **Checklist**: the date, whether the certificate of analysis came, whether the containers are labelled, their intactness, the condition of the carrier, and the batches: number, containers, kind of container, quantity per container, manufacturing and expiry dates, and the gross weights taken. The batches must account for exactly what was delivered. A checklist is written once.
- **Goods received note**: tick checked materials that have batches, give the carrier, vehicle and optional declaration number. The batches are read first, then the note is created; they move into quarantine.

### Quarantine area
Goods received notes with their batches and each batch's standing with quality control. A note prints as a document.

## Changed from oryx-next, and why

| oryx-next | Now | Why |
| --- | --- | --- |
| The checklist offered Good/Bad for the carrier and Yes/No for intactness. | The carrier is Clean, Dirty, Wet, Insect infested, Excessive dust or Damaged; intactness is Good or Bad. | Those are the values the server stores. The old choices saved the wrong meaning. |
| The certificate of analysis answer was pre-filled from the supplier's status. | Both yes/no questions start unanswered. | The person checking has to answer. |
| A retest date was asked for and never sent. | It is not asked for. | The server's request has no such field. A raw material batch needs its expiry date instead. |
| A batch's "date received" was its manufacturing date. | It is the date of the check. | It was the wrong date. |
| "Create GRN" reported success without reading the server's answer. | A failure is shown, and nothing is reported as created. | A note that failed looked as if it had been made. |
| Creating a GRN was gated by the checklist permission. | `CanCreateGrnFor…Materials`. | One permission per action. |
| A checklist could be opened and saved again for a delivery already checked. | The page refuses, and links to the saved one. | The server does not check, and would create the batches twice. |
| The billing sheet's package description was sent the number of packages. | The description is its own field. | It was the wrong value. |
| Free-time expiry and demurrage dates were typed separately. | Worked out from arrival and free days. | Three fields that could contradict each other. |
| One currency for every charge on a sheet. | One currency selection per creation/add-charges submission, copied to every charge in its API payload. Existing saved charges keep their currencies. | Avoid repeated selection while preserving the server's per-charge accounting contract. |

## Known limits (server behaviour)

- Distributing one material sends the whole delivery of it to **one** store's receiving area, the one chosen in the dialog, even when several departments share it.
- The server's per-material confirmation does not add to the requisitions' received quantities.
- The goods received note number is suggested from a count and can be offered to two people at once; the field can be corrected.
- The receiving list shows the materials of the signed-in user's own department's store; that is the server's filter.
- From a note: assigning its batches to shelves is done in the distributed area; approving or rejecting a batch belongs to quality control and is not on this page.

## Tests

`modules/shipment-invoices/components/invoices.test.tsx`, `modules/shipment-documents/components/shipments.test.tsx`, `modules/billing-sheets/components/billing-sheets.test.tsx`, `modules/billing-sheets/components/charges-editor.test.tsx`, `modules/material-distribution/components/distribution.test.tsx`, `modules/receiving-area/components/receiving.test.tsx`: the rules of each step, permissions, nothing written before a confirmation, request bodies and their order.

## Manufacturing and expiry dates are month and year

A batch's manufacturing and expiry dates are a month and a year everywhere: on the checklist form (month picker), and on every list, detail page and print that shows them (`formatMonthYear` in `shared/format/dates.ts`, "Jun 2028"). `oryx-next` asked for and showed a full date.

The server keeps full dates, so a month is saved as its first day for manufacture and its **last day** for expiry: a batch marked 06/2028 can be used until 30 June 2028. Retest dates, certificate validity and free-time dates are unchanged (full dates).

## Quarantine GRN parity (2026-10-20)

The GRN detail now uses all backend batch status values, including **Approved (8)**, and shows allocated, distributed, and retest fields. Its **Distribute** action offers approved materials and a warehouse allocation review using the existing endpoint and audit headers from Oryx Next. Raw/packaging permissions, fresh stock checks, failure handling and the existing backend concurrency/authorization limitation are described in [workflows.md](workflows.md); API assumptions are in [services.md](services.md).

Regression coverage: `modules/quarantine-area/lib/distribution-plan.test.ts` and `components/distribution.test.tsx` cover the status contract, allocation/request identity, units, shortfalls, real route access, writes/audit headers, stale approval, duplicate clicks, permission revocation, and server/offline failures. Receiving regression tests also run against the shared batch schema.
