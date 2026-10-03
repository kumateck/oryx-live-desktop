# Purchasing: requisitions, sourcing and quotation management

Frontend-only. No backend change. Rebuilt from `oryx-next` (`production/requisition`, `procurement/requisition`, `procurement/quotations`, `procurement/sales-quotation`, `procurement/price-comparison`, `procurement/awarded-quotations`, `procurement/profoma-responses`).

## The flow

1. **Production raises a purchase requisition** for materials that need ordering. It waits for approval.
2. **Procurement sources it**: for each material, foreign or local, and which suppliers are asked to quote.
3. **Quotation request**: each chosen supplier is emailed one request for everything sourced to them.
4. **Quotation response**: the prices the supplier quoted are recorded.
5. **Price comparison**: one supplier is chosen per material; that creates the purchase orders.
6. **Proforma request**: the awarded supplier is emailed the order and asked for a proforma invoice.
7. **Proforma response**: the proforma invoice is recorded and attached; the order moves on to purchase orders.

## Pages and permissions

| Page | Route | Module | View | Act |
| --- | --- | --- | --- | --- |
| Create purchase requisition | `/production/requisition/create` | `requisitions` | `CanViewRawMaterialRequisitionsForCreation` / `CanViewPackageMaterialRequisitionsForCreation` | `CanCreateRawMaterialRequisitions` / `CanCreatePackageMaterialRequisitions` |
| Material requisitions | `/production/requisition/general`, `/:id/details` | `requisitions` | `CanViewRawMaterialRequisitions` / `CanViewPackagingMaterialRequisitions` | – |
| Purchase requisitions (sourcing) | `/procurement/requisition`, `/:id` | `sourcing` | `CanViewPurchaseRequisitions` | `CanSourcePurchaseRequisition` |
| Quotation requests | `/procurement/quotations` | `quotation-requests` | `CanViewForeignQuotation` / `CanViewLocalQuotation` | `CanSendForeignQuotationRequest` / `CanSendLocalQuotationRequest` |
| Quotation responses | `/procurement/sales-quotation` | `quotation-responses` | `CanViewForeignQuotationResponse` / `CanViewLocalQuotationResponse` | `CanSendForeignQuotationResponse` / `CanSendLocalQuotationResponse`; agreement proposals also need `CanManageSupplierContracts` |
| Price comparison | `/procurement/price-comparison` | `price-comparison` | `CanViewForeignVendorPricing` / `CanViewLocalVendorPricing` | `CanApplyChangesForForeignVendorPricingSelection` / `…Local…` |
| Proforma requests | `/procurement/awarded-quotations` | `proforma-requests` | `CanViewForeignProformaRequest` / `CanViewLocalProformaRequest` | `CanSendForeignProformaRequest` / `CanSendLocalProformaRequest` |
| Proforma responses | `/procurement/profoma-responses` | `proforma-responses` | `CanViewForeignProformaInvoiceSubmissions` / `CanViewLocalProformaInvoiceSubmissions` | `CanSendForeignProformaInvoice` / `CanSendLocalProformaInvoice` |

Every view permission opens the page read-only; each action has its own key. Raw / Packaging and Foreign / Local are separate lists behind separate permissions (`?type=0|1`), and a list the user may not see is never opened, whatever the address says.

Shared pieces live in `shared/procurement` (price arithmetic, supplier-type switch, supplier summary) and `shared/units/quantity.ts` (`convertUnit`).

## Quantities and prices

- Quantities are stored in the material's own unit (often mg) and typed in the largest unit of its family (kg, L). Conversions go through `convertUnit`, which returns nothing rather than guess when two units do not convert.
- A price is always a price **per unit**. A line's value is `price × quantity expressed in the price unit`; when the price has no unit, no value is shown.
- Unit prices are shown exactly as entered. Money is shown to two decimals, except an amount too small for that, which is shown in full instead of `0.00`.

## What each page does

### Create purchase requisition
- The department's materials with warehouse stock, stock in other departments, levels and expired stock; at or under the reorder level is flagged. Category filter and header search.
- Tick materials across pages (the choice is kept by material while the page is open), then **Raise purchase requisition**: number (suggested from the code rule), needed-by date, remarks, and an order quantity per material with its unit. "Short of maximum" shows how far stock is under the maximum level.

### Material requisitions
- All requisitions with a filter for Purchase / Stock, and a status that says what each is waiting on (approval, sourcing, issue).

### Purchase requisitions (sourcing)
- The list shows approved purchase requisitions with at least one material still waiting for suppliers.
- Per material: foreign or local, then the suppliers set up for that material and type. **Save suppliers** confirms how many materials are sent and how many are left for later.

### Quotation requests
- Suppliers with materials to be quoted; a **To send / Sent** filter.
- **Review and send** shows the supplier and the materials; **Send request by email** sends it. The server builds the PDF and the email.

### Quotation responses
- Sent requests; an **Awaiting prices / Recorded** filter.
- **Record prices**: unit price and the unit it is priced per, for each material, with the line value worked out as you type. The supplier's standing agreement, if one is in force, pre-fills the price.
- A line whose quantity is under 1% of the priced unit (5 mg priced per kg) has to be confirmed before it is recorded.
- For users who manage supplier agreements: where quoted prices differ from the standing agreements, choose **Record prices only** or **Record and propose agreement changes** from an agreed date.

### Price comparison
- Per material, every supplier's quote side by side: unit price, cost for the full quantity, manufacturer. The lowest price per unit is marked.
- **Create purchase orders** is available once every material has a supplier, and confirms which orders will be created.

### Proforma requests / responses
- Request: the order's lines and value; **Send request by email**.
- Response: proforma invoice number, terms of payment, delivery mode, estimated delivery and the document (PDF, image, Word or Excel, up to 10 MB each).

## Changed from oryx-next, and why

| oryx-next | Now | Why |
| --- | --- | --- |
| "Print" on a quotation request or proforma request **sent the email** as a side effect of opening the print dialog. | Sending is its own button; nothing is sent by looking. | A write must be a deliberate action. |
| The app composed an email subject, body and HTML attachment (with a hard-coded company name, address and phone) and posted it. The server ignores it and sends its own. | Not sent. | Dead data that looked authoritative. |
| The proforma document was uploaded **before** its details were saved. The upload is what moves the order on, so a failure in between left an order with no invoice number or terms, gone from the list. | Details first, then the document. If the upload fails the order stays in the list and the dialog says the details were saved. | Dependent requests in order, with the half-done case handled. |
| Sourcing listed every line of the requisition, including ones already sent to suppliers. Saving sent them again, doubling the quantity on the supplier's request. | Only lines still waiting can be sourced; the rest are shown as handled. | Rule taken from the line's own status. |
| Sourcing a requisition that was not approved failed only after submitting. | Explained on the page; nothing to submit. | The server's approval rule is known up front. |
| Sourcing required suppliers for every line. | Lines can be left for later, with a confirmation saying so. | The server tracks sourcing per line. |
| Sourcing quantities were converted to the largest unit and back before sending. | Sent exactly as stored. | No round trip, no rounding. |
| One "loading suppliers" flag was shared by every row. | Each row loads and caches its own suppliers. | Rows no longer flicker each other. |
| A purchase requisition line's quantity was converted to the family's smallest unit whatever unit the material is kept in. | Converted to the material's own unit. | A material kept in g would be sent 1,000× too large. |
| Selected materials were saved in browser storage. | Kept only while the page is open. | A stale selection is not a draft. |
| Price comparison grouped awards by supplier and used the first request it found for all of them. | Grouped by supplier **and** quotation request. | The server refuses an order whose materials are not on the named request. |
| "Lowest price" compared figures across currencies. | Marked only when every quote is in the same currency; otherwise a note says why not. | Otherwise it names the wrong supplier. |
| A quote with no price unit could be selected and failed on apply. | It cannot be chosen, and says what to fix. | Same rule as the server. |
| Agreement changes were submitted in parallel. | One at a time, after the prices are recorded; a failure is reported with the count and never hides that the prices were saved. | Ordered requests. |
| Agreement pre-fill used any agreement in force, including pending and rejected proposals. | Approved agreements only. | A proposal is not an agreed price. |
| Minimum quantity of 0.1 and minimum price of 1 in the form rules. | Above zero. | Small quantities and prices under 1 are real. |

Kept on purpose: applying a price comparison still needs **every** material decided, because the server closes all other open quotes of that supplier type when it runs.

## Added after the first pass

### Stock availability and stock transfer (create requisition page)
- **Stock availability** on a material: what every store and production floor holds (usable, expired, total), and what is already on order with its stage and expected date.
- **Request stock transfer**: ask one or more departments to release stock instead of buying it. Only departments holding at least the quantity asked are offered, and never the user's own. Uses the create-requisition permission; the server has no separate key for it.
- `oryx-next` read the schedule and product from the page address, which this page does not have, and sent neither a request number nor the total. Both are sent now.

### Purchase requisition from a scheduled batch
- On a schedule's batch, **Raise purchase requisition** appears above the raw and the packaging materials when some are short and not already being bought. Each line starts at what the batch is short by. The requisition is tied to the batch, so the server refuses a second one for the same material.
- `oryx-next` started each line at the full quantity needed rather than the shortfall.

### Purchase orders

| Page | Route | View | Act |
| --- | --- | --- | --- |
| Create purchase orders | `/procurement/purchase-orders` | `CanViewForeignPurchaseOrder` / `CanViewLocalPurchaseOrder` | `CanCreateForeignPurchaseOrder` / `…Local…` |
| Check purchase orders | `/procurement/purchase-orders/check` | same | `CanCheckForeignPurchaseOrder` / `…Local…` |
| Approved purchase orders | `/procurement/purchase-orders/approved` | `CanViewApprovedForeignPurchaseOrder` / `…Local…` | `CanSendApprovedForeignPurchaseOrder` / `…Local…` |
| Order list | `/procurement/purchase-order-lists` | view keys | – |
| Order | `/procurement/purchase-orders/:id` | view keys (approved view for approved orders) | – |
| Revise order | `/procurement/purchase-orders/:id/revise` | – | `CanReviseForeignPurchaseOrder` / `…Local…` |

- **Finalise**: add insurance and freight (foreign, both required) or tax (local, optional). The total and its words are worked out, never typed. The order then waits to be checked.
- **Check**: read the order and mark it checked, which sends it to its approvers.
- **Send**: an approved order is emailed to its supplier with the expected delivery date (the proforma's date is offered).
- **Order list**: every order with its stage, filtered by status; an order's page shows lines, charges, attachments and revision history.
- **Revise** (sent orders): change a line's quantity or price, or take a line off. Only lines that really changed are sent. The order then appears under Check, in its Revised list, to be checked and approved again.

Changed from `oryx-next`:

| oryx-next | Now | Why |
| --- | --- | --- |
| Finalise, check and send all used the "create" permission. | Each uses its own key, which the server already has. | One permission per action. |
| The grand total and the amount in words could be typed, then compared with the calculation. | Both are calculated. | Nothing to mistype. |
| "Print" on an approved order sent it. | Send is its own button. | A write must be a deliberate action. |
| Revising sent every line as changed, with no price unit. | Only changed lines, each with its price unit. | A revision should say what changed. |
| A revised order could only be checked again from the order list's menu. | The Check page has a Revised list. | It was easy to lose. |
| An empty tax field failed validation. | An empty tax is no tax. | The field is optional. |

The server records an order as sent **before** it emails it. If the email fails, the app says the order may already be recorded as sent and reloads it, rather than inviting a second send.

### Printing
Requisitions, quotation requests, proforma requests and purchase orders print as documents. See [printing.md](printing.md).

### Moving a line during a revision

On the revise page a line's menu also offers:

- **Reassign to another supplier.** The other suppliers' quotes for the material are listed with their prices. Confirming takes the line off this order (which reopens those quotes) and then awards the chosen quote, creating that supplier's order. The two requests run in that order; if the second fails the app says the line is back in price comparison, where it can be awarded.
- **Return to sourcing.** Takes the line off the order and sends the material back to be sourced again.
- **Add a line.** Adds a material the supplier is set up for, with its quantity and price.

Reassigning is refused while a price comparison is open for the supplier type: awarding the new supplier makes the server close every other open quote of that type, which would discard the quotes still waiting. It is also refused when no other supplier quoted for the material. A line with unsaved changes has to be saved or reset first.

### Correcting recorded prices

A recorded quotation's menu has **Correct prices** for lines still waiting in price comparison. Once a material is awarded its price is on a purchase order, and changing the quotation would only make the two disagree.

The server does not say which lines are still open. A line counts as open only when price comparison shows this supplier quoting the material at exactly the recorded price and unit, and no other quotation of the supplier in view carries the same material. This errs towards not offering a correction.

## After an order is sent

Supplier invoices, shipments, billing sheets, material distribution and receiving are in [inbound-logistics-migration.md](inbound-logistics-migration.md).

## Not migrated yet

- Cancelling an order.

## Tests

- `shared/procurement/price.test.ts`: unit conversion, line cost, comparable price, negligible lines, money formatting.
- `modules/requisitions/lib/requisitions.test.ts`: order lines, statuses, sourcing rules and request.
- `modules/quotation-responses/lib/quotations.test.ts`: price lines, agreements, send rules, comparison ranking and purchase-order grouping, order totals.
- `modules/requisitions/components/requisitions.test.tsx`: create, list, detail, sourcing (permissions, approval, confirmation, request body).
- `modules/quotation-requests/components/quotations.test.tsx`: the five quotation pages (permissions, nothing written on view, request bodies and order).
- `modules/purchase-orders/lib/orders.test.ts`, `components/orders.test.tsx`: totals, charges, finalise, check, send, list, order page, revision.
- `shared/format/amount-words.test.ts`: amounts in words.
