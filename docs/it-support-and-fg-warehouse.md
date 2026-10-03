# IT Support and FG Warehouse

Frontend-only. Every screen was read in full in `oryx-next` before it was built.

## IT Support

| Page | Route | Module | Permission |
| --- | --- | --- | --- |
| Audit trail | `/access-management/audit-trail` | `modules/audit-trail` | `CanViewAuditTrail` |
| Roles and permissions | `/access-management/permissions` | `modules/permissions` | `CanViewPermissions`; apply `CanUpdateExistingPermission`; reset `CanResetPermission` |
| My IT issues | `/it/my-issues`, `/:id/details` | `modules/it-tickets` | anyone signed in; report `CanCreateTicket` |
| IT team tickets | `/it/support-tickets`, `/:id/details` | `modules/it-tickets` | any of `CanViewAllTickets`, `CanAssignTicket`, `CanCloseTicket`, `CanCommentOnTicket` |

Users and roles were already built. A user's role is changed from the users list (a dialog), which replaces the `oryx-next` edit page.

- **Audit trail** adds what `oryx-next` left out but the server already gives: the area, the kind of action, the address it came from, a date range, the header search, and a mark on requests the server refused.
- **Permissions** reuses the role editor's picker. Changes are counted, applied after a confirmation, and never carry over when another role is chosen.
- **Tickets**: who may do what follows `lib/tickets.ts` (`moveBlock`): the assignee starts and finishes work; assigning and closing need their permissions; the reporter, or whoever may close, may reopen. On the board a card is moved by dragging its number or from its menu, and either way the move is confirmed first. `oryx-next` changed the status the moment a card was dropped. The board says when it is not showing every ticket.

## FG Warehouse

| Sidebar | Route | Module |
| --- | --- | --- |
| Customer management | `/crm/customers`, `/:id`, `/:id/quotations/create`, `/crm/quotations/:id` | `modules/customers` |
| Production order | `/crm/production-order`, `/:id` | `modules/production-orders` |
| FGTN | `/warehouse/finished-goods-transfer-notes`, `/:id` | `modules/finished-goods-notes` |
| Approved products | `/warehouse/approved-products`, `/:id` | `modules/approved-products` |
| Packing list, Allocations | `/crm/allocations?type=0|1`, `/:id` | `modules/fg-dispatch` |
| Proforma invoice, Invoice | `/crm/proforma-invoice`, `/crm/invoices`, `/:id` | `modules/fg-dispatch` |

The flow: a customer's quotation is approved, converted to a production order, packed from approved batches into a packing list, approved into an allocation, invoiced with a proforma invoice, sent to the customer, turned into an invoice by attaching their purchase order, loaded, given a waybill, and delivered.

### Done differently, on purpose

| oryx-next | Now | Why |
| --- | --- | --- |
| The proforma invoice was saved as a side effect of pressing Print. | It is raised only by **Generate proforma invoice**; printing only prints. | Nothing is written by looking at or printing a document. |
| Loaded, delivered and sent-to-customer ran on one click. | Each is confirmed first, and offered only as the next step (`nextStep`). | They cannot be undone. |
| Approving an FGTN compared the total against shippers × loose. | Received packs = shippers × packs per shipper + loose, and may not exceed what was sent. | The old check let more be received than was sent. |
| Packing list quantities were filled in and could not be changed. | Packs are typed, and checked against the batch's free stock and what the line still needs. | Part of a batch has to be usable. |
| A packing list was sent as one entry per batch row. | One entry per product and packing style, carrying all its batches. | That is the shape the server's request has. |
| Batches for a product were matched by packs per shipper. | By packing style. | Two styles can share a shipper size. |
| Customer phone had to be exactly 10 digits. | 7 to 15 digits. | Export customers have other formats. |
| Order detail showed the phone number as the address. | The address. | It was a mistake. |
| Approved products pages checked the raw-materials permission. | `CanViewApprovedProducts`, as the sidebar does. | The page and the menu disagreed. |
| Packing list could be downloaded as a PDF built in the browser. | Print, which also saves as PDF. | No extra library. |
| Shippers and loose on a packing list re-packed loose packs into shippers across batches. | Each batch's own shippers and loose are added up. | Loose packs of different batches are not one shipper. |
| Invoice totals used one currency symbol for every line. | One total per currency. | An agreed price can be in another currency than the list price. |

### Not carried across

These exist in `oryx-next` only as empty placeholders ("Page") or are not reachable from any screen: the invoice detail and waybill-create pages under `/crm/invoices/:id`, the manual production order form, and the allocation proforma form. `/crm/invoices/:id` opens the invoice record instead. The CRM job request pages (`/crm/jobs`) are not in the FG Warehouse menu and are not built yet.

Load and deliver have no permission of their own on the server; they use the permission of the list they are on.

## Tests

`modules/it-tickets/tickets.test.tsx`, `modules/customers/customers.test.tsx`, `modules/production-orders/orders.test.tsx`, `modules/finished-goods-notes/notes.test.tsx`, `modules/fg-dispatch/dispatch.test.tsx`.
