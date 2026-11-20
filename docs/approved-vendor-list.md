# Approved vendor list

QA's Approved Manufacturer List for Raw Materials (Annexure QAD/SOP/007/A03-06) is a document with revisions.
The server owns its rules (backend `docs/approved-vendor-list.md`). This page covers what the desktop shows.

## Pages (`approved-vendor-list` module, Quality Assurance → Approved Vendor List)

| Route | Key | What |
| --- | --- | --- |
| `/qa/approved-vendor-list` | `CanViewApprovedVendorList` | Every revision, newest first. **Prepare list** (no list yet, `CanCreateApprovedVendorList`) or **New revision** (from the current list, `CanReviseApprovedVendorList`). Neither is offered while a revision is being prepared. |
| `/qa/approved-vendor-list/new` | view + create | The first list: Annexure No., Revision No., Supersedes, and its lines. |
| `/qa/approved-vendor-list/revise` | view + revise | Starts from the current list's lines. Supersedes is fixed to the current revision number. |
| `/qa/approved-vendor-list/:id/details` | view | Header, lines (lapsed lines marked), Prepared / Checked / Approved by with designation and date, and the Review panel. **Correct list** (`CanEditApprovedVendorList`, while in review) and **Print** (`CanPrintApprovedVendorList`). |
| `/qa/approved-vendor-list/:id/edit` | view + edit | Corrects a list awaiting review or returned. It sends the review version it was opened at. |

A line names a raw material, a manufacturer and a supplier. The pickers offer the manufacturers mapped to the material first, then the suppliers mapped to supply it from that manufacturer, then everything else. A new name can be entered instead. Saving creates the record and maps it, and the server checks the manufacturer and supplier keys for that. Qty/Pack (kg) defaults to the manufacturer mapping's single pack size. Dates are month and year, as on the paper form. A line is valid through the end of its validity month.

The print follows the paper layout: the material table with #, Item code, Material name, Manufacturer name & address, Supplier name, Qty/Pack (kg), Date of approval and Validity date. It closes with three signature lines, Prepared by (Officer QA), Checked by (Deputy Manager QA) and Approved by (General Manager QA). The print reads `GET approved-vendor-list/{id}/print`, which needs the print key.

## Review and approval

Saving opens the document review. Checking happens in the Review panel (`CanReviewApprovedVendorList` / `CanReturnApprovedVendorList`), and the item also appears in My Pending Reviews. Approval goes through Pending Approvals as `ApprovedVendorList`, with `CanApproveApprovedVendorList` / `CanRejectApprovedVendorList`. Configure the approval workflow (General Manager QA) under Settings → Approvals. Without a workflow the list is approved automatically on check and carries no "Approved by".

## Procurement

`shared/procurement/approved-vendors.ts` reads `POST approved-vendor-list/eligibility` (`CanViewApprovedVendorEligibility`) and disables what the current list does not allow:

- Sourcing: the suppliers to ask for a material.
- Price comparison: choosing a quote.
- Purchase order revision: adding a material.
- Shipment invoices: a line's manufacturer.

Materials not on the list are unrestricted. Without the key nothing is disabled, but the server still refuses the save. The quotation price entry and the PO invoice screen have no UI hint yet; the server refuses there with the reason.
