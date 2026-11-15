# Reports hub

All reports open from one place, `/reports`, grouped by what they are about rather than by department:
Suppliers and manufacturers, Purchasing and shipments, Materials, Production and batch records,
Products and finished goods, General stores, and People. The sidebar has a single **Reports → All reports** entry.

- **Directory**: `modules/reports/lib/report-directory.ts` lists every report once (`reportEntries`) with its group,
  address (`/reports/<slug>`) and views. A report that has a summary and a detailed form is one entry with
  **Summary | Detail** tabs (`?view=summary|detail`). A test fails if a catalog report is missing or listed twice.
- **Access**: every report has its own backend key (`modules/reports/lib/report-keys.ts`, for example
  `CanViewApprovedManufacturerListReport`). A Summary | Detail report has one key per view. The hub, the sidebar
  entry and each report page show only what the user's keys allow, and each view is checked (`viewRequirement`)
  before anything loads. The old group keys (`CanViewWarehouseReport`, `CanViewProcurementReport`, …) no longer open
  hub reports; on the server they still guard the register reports outside the hub. Filter lookups (departments,
  materials, products, suppliers and the like) open for any one report key. Roles keep their reports through the
  backend grant migration `GrantPerReportViewKeys`, which gives each role the keys of the reports its group key covered.
- **Old addresses**: the former department pages (`/reports/warehouse-report`, `/reports/qc-qa-reports/...`,
  `/hr/human-resources-report/...`, including `?report=<key>`) redirect to the matching report or group
  (`LegacyReportRedirect`).
- **Pins**: a person can pin reports to the top of the hub. Pins are a convenience stored on that computer only.

## Approved manufacturer list

`/reports/approved-manufacturer-list` is built from the supplier–manufacturer–material mappings
(`GET report/supplier-materials`, guarded by `CanViewApprovedManufacturerListReport` or either supplier mapping report key). It shows one row per material, manufacturer
and supplier, ordered by item code, with approval and validity as month and year. The date of approval is when the
supplier's status was changed to Approved (recorded on the supplier); a supplier that is not approved shows none. Status is Valid, Expiring (within
six months), Expired, or No validity date.

The print is the controlled copy: landscape, "Page X of Y", the document reference / revision / supersedes line
(entered above the table, remembered on that computer), and the signature block:

- **Prepared by**: the person printing, with the signature saved in signature settings and the date generated.
  With no saved signature the line is blank.
- **Checked by / Approved by**: blank lines for a hand signature. They will fill in automatically only when a
  configurable checker step (like approval workflows) exists and the person has confirmed in the system.

Landscape prints across the app now carry page numbers (`@page oryx-landscape` in `shared/theme/document.css`).

## BMR issued

`/reports/bmr-issued` has two views, each with its own key:

- **By date** (`CanViewBmrIssuedReport`): BMRs issued in a date range, for one production department or all.
- **By product** (`CanViewBmrIssuedByProductReport`): every BMR issued for one product so far, or within issue dates
  when both are chosen (`GET report/bmr-issued/by-product`). Production users see only their own department's products.
