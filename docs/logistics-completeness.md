# Logistics: what was carried across from oryx-next

Frontend-only. Every logistics screen in `oryx-next` was read in full (list, columns, create, detail, print, dialogs) and compared with the desktop app. This lists what was missing and is now built, and where the desktop app does it differently.

## Shipment documents and waybills (`modules/shipment-documents`)

| oryx-next | Now |
| --- | --- |
| Pay charges and Print charges from the list (shipments at port) | List actions **Pay charges**, **Add charges**, **Print charges**; the same on the shipment's page. They read the shipment's billing sheet first. Offered at any stage, held back with a reason until there is an approved billing sheet. |
| Status change refuses while a charge is unpaid | Checked before the request is sent, with how many charges are unpaid; the server checks too. |
| Document card: code, invoice, created date, total cost, payment status, approval status | **Document** group with all of them, plus purchase orders and the billing sheet's standing. |
| Supplier card: company, contact, email, phone, country, address | `shared/procurement/supplier-details.tsx`, also kind and currency. |
| Timeline with a description and time per stage and a percentage | `components/shipment-timeline.tsx`. A waybill counts its own three stages, so it reaches 100%. |
| Billing sheet section: shipping, dates, charges, cost summary | `billing-sheets/components/billing-summary.tsx`, with a link to the sheet and each charge's payment state. |
| Invoice items: price, received and expected quantity and cost, manufacturer, reason | `shipment-invoices/components/invoice-lines-table.tsx`, one table used on the shipment, the invoice, the billing sheet and both create forms. |
| Attachments with image thumbnails and a viewer | `shared/attachments/attachment-list.tsx`: thumbnail, view in place (images and PDFs), open in the browser. |
| Printed "Billing sheet document" and "Waybill report" | `components/shipment-print.tsx`: materials, charges and grand total for a shipment; stages, materials with pharmacopoeia, and specification numbers for a waybill; who prepared it. |
| Shipment charges memo | `billing-sheets/components/charges-print.tsx`: the shipment's facts, each charge and whether it is paid, what is still to pay, and the arrival, free-time and demurrage dates. |

## Shipment invoices (`modules/shipment-invoices`)

- Detail: lines grouped by purchase order with each order's count, quantity and value; item count; total quantity; full supplier details; when it was recorded; **Print** (supplier, items, material specifications, notes and reasons, signatures).
- Create: each line shows what was ordered and what is already invoiced, next to what is left.

## Billing sheets (`modules/billing-sheets`)

- List: invoice date. Detail: total amount (invoice and charges), invoice amount and item count, the cost summary, the full invoice lines, attachments with the viewer. Print: full lines with the invoice total, grand total, who prepared it. Create: the chosen invoice's lines.

## Material distribution (`modules/material-distribution`)

- List: document kind and stage. Detail: progress (materials fully allocated), invoice, arrival, materials, manufacturers, value, supplier details.
- Table: supplied, requested, allocated, remaining, departments, status. **View** opens the breakdown: material kind and description, supply chain (manufacturers, purchase orders, average unit price), and a card per department with its code, original request and its standing, requested / allocated / remaining, and the invoice lines its share comes from.

## New pages

- **Logistics dashboard** `/logistics-dashboard` (`modules/logistics-dashboard`; `CanViewShipmentInvoice` or `CanViewWaybill`): period (all, this week, this month), six figures that link to their lists, the shipment and waybill pipeline, shipment stages, longest on demurrage, invoice and billing sheet status, refresh.
- **Available stock** `/stock/available` (`modules/available-stock`; `CanViewRawMaterialStock` / `CanViewPackingMaterialStock`): raw or packaging, all departments or one, searched by the header search.

## Done differently, on purpose

| oryx-next | Now | Why |
| --- | --- | --- |
| Grand total always added invoice and charges, using one currency symbol for both. | Added only when the charges are in the invoice's currency; otherwise shown apart. | Money in two currencies cannot be added. |
| Invoice quantity total added every line's number. | One figure per family of units ("70 kg + 5 L"). | Weights and volumes cannot be added. |
| "Paid" counted a payment still waiting for approval as not paid on screen but printed "Paid" from another field. | One rule everywhere: paid once the payment is approved. | The screen and the print have to agree. |
| Available stock showed "Available" and "Stock" as the same raw number, in the smallest unit. | In stock, reserved, and available (stock less reserved), in the largest unit. | The two columns were the same field, and mg totals are unreadable. |
| Requisition status 2 was labelled "Approved" on distribution cards. | Labelled by the server's own status: sourced. | 2 is Sourced. |
| Dashboard had a supplier type filter that no request used. | Left out. | A filter that changes nothing misleads. |
| Dashboard pipeline drawn with a chart library. | Drawn as bars in a table. | No new dependency; readable by screen readers. |

## Tests

`modules/logistics-dashboard/logistics.test.tsx`: the totals and progress rules, and the shipment, invoice, distribution, dashboard and available stock pages against a stubbed backend.
