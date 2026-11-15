# Reports hub

All reports open from one place, `/reports`, grouped by what they are about rather than by department:
Suppliers and manufacturers, Purchasing and shipments, Materials, Production and batch records,
Products and finished goods, General stores, and People. The sidebar has a single **Reports → All reports** entry.

- **Directory**: `modules/reports/lib/report-directory.ts` lists every report once (`reportEntries`) with its group,
  address (`/reports/<slug>`) and views. A report that has a summary and a detailed form is one entry with
  **Summary | Detail** tabs (`?view=summary|detail`). A test fails if a catalog report is missing or listed twice.
- **Access**: the hub shows only reports the user may run. Each view is checked with its own requirement
  (`viewRequirement`) before anything loads. Today that is the backend's group key for the report
  (`CanViewWarehouseReport`, `CanViewProcurementReport`, …). Per-report keys need a backend change: new keys,
  endpoint guards, filter-lookup guards and a grant migration. When they exist, only `viewRequirement` and the
  manifest change.
- **Old addresses**: the former department pages (`/reports/warehouse-report`, `/reports/qc-qa-reports/...`,
  `/hr/human-resources-report/...`, including `?report=<key>`) redirect to the matching report or group
  (`LegacyReportRedirect`).
- **Pins**: a person can pin reports to the top of the hub. Pins are a convenience stored on that computer only.

## Approved manufacturer list

`/reports/approved-manufacturer-list` is built from the supplier–manufacturer–material mappings
(`GET report/supplier-materials`, guarded by `CanViewProcurementReport`). It shows one row per material, manufacturer
and supplier, ordered by item code, with approval and validity as month and year. Status is Valid, Expiring (within
six months), Expired, or No validity date.

The print is the controlled copy: landscape, "Page X of Y", the document reference / revision / supersedes line
(entered above the table, remembered on that computer), and the signature block:

- **Prepared by**: the person printing, with the signature saved in signature settings and the date generated.
  With no saved signature the line is blank.
- **Checked by / Approved by**: blank lines for a hand signature. They will fill in automatically only when a
  configurable checker step (like approval workflows) exists and the person has confirmed in the system.

Landscape prints across the app now carry page numbers (`@page oryx-landscape` in `shared/theme/document.css`).
