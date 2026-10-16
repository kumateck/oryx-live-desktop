# Printing

`shared/print` is the one way a document is printed.

- `PrintButton` opens a preview; `PrintPreviewDialog` shows the document as it will print, with a **Print** button that calls the system print dialog. Printing never saves or sends anything.
- A document is built from `PrintHeader` (company and title), `PrintFacts`, `PrintTable` (its header repeats on every page; rows are never split) and `PrintSignatures`.
- The printer's copy is rendered directly under the page body and is the only thing visible in print (`@media print` in `styles.css`). Documents are black on white whatever the app's theme.
- The company name, address and logo come from `shared/print/company.ts`. Change them there and every document follows.

## Documents

| Document | Where |
| --- | --- |
| Bin card | Approved material, Bin card tab |
| Location chart record | Location chart, open rack |
| Material location record | Material location, a material |
| Requisition | Requisition detail and the sourcing page |
| Quotation request | Quotation request dialog (blank price columns for the supplier) |
| Proforma invoice request | Proforma request dialog |
| Purchase order | Order review dialogs and the order page (with charges, total in words and signature lines) |
| Batch manufacturing record head | Product page |
| Monthly production plan | Production schedules, Monthly report |
| Certificate of analysis (preview) | Pending approval of analytical raw data |

In `oryx-next`, "Print" on a quotation request, proforma request or approved order also sent the email. Here printing and sending are separate buttons.
