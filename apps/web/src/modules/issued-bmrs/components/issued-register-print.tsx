import { useMemo } from "react";
import { formatDate, formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures, PrintTable } from "@/shared/print/print-sheet";
import { useGetIssuedBmrRegisterQuery } from "../api/issued-bmr-api";
import { issuedBmrAudit } from "../lib/access";
import { filterArgs, filterSummary, type IssuedFilters } from "../lib/filters";
import { issuedRegisterSchema, type IssuedBmr, type IssuedRegister } from "../schemas/issued-bmr";

export type RegisterLayout = "register" | "byProduct";
const day = (value: string) => formatDate(value) ?? value;

/** The printed issued BMR & BPR register, or the issued-by-product report, for the page's filters and search. */
export function IssuedRegisterPrint({ layout, filters, search, department, onClose }: {
  layout: RegisterLayout; filters: IssuedFilters; search: string; department: string | null; onClose: () => void;
}) {
  const query = useGetIssuedBmrRegisterQuery({ ...issuedBmrAudit, ...filterArgs(filters), ...(search.trim() ? { searchQuery: search.trim() } : {}) },
    { refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => { const result = issuedRegisterSchema.safeParse(query.data ?? null); return result.success ? result.data : null; }, [query.data]);
  const title = layout === "register" ? "Issued BMR & BPR register" : "Issued batches by product";
  const problem = query.error ? apiErrorMessage(query.error) : query.isSuccess && !parsed ? "The server returned issued records the app could not read." : null;
  return <PrintPreviewDialog title={title} landscape={layout === "register"} ready={Boolean(parsed)} onClose={onClose}
    note={problem ?? (parsed?.truncated ? `Showing the latest ${String(parsed.rows.length)} of ${String(parsed.total)} records. Narrow the dates or department to print them all.` : null)}>
    {parsed ? <RegisterDocument layout={layout} title={title} register={parsed} scope={filterSummary(filters, department, day)} search={search.trim()} /> : null}
  </PrintPreviewDialog>;
}

function RegisterDocument({ layout, title, register, scope, search }: { layout: RegisterLayout; title: string; register: IssuedRegister; scope: string; search: string }) {
  const totalBatches = register.byProduct.reduce((sum, item) => sum + item.batches, 0);
  return <div className="space-y-3">
    <PrintHeader title={title} reference={`Printed ${formatDateTime(new Date().toISOString()) ?? ""}`} aside={<p>Quality Assurance</p>} />
    <PrintFacts facts={[{ label: "Covering", value: scope }, ...(search ? [{ label: "Search", value: search }] : []),
      { label: "Batches issued", value: String(register.total) }, { label: "Products", value: String(register.byProduct.length) }]} />
    {layout === "register" ? <PrintTable<IssuedBmr> caption="Issued BMR and BPR" rows={register.rows} rowKey={(row) => row.id} empty="No BMR or BPR was issued for these filters."
      columns={[
        { id: "n", header: "#", width: "6%", cell: (_row, index) => String(index + 1) },
        { id: "batch", header: "Batch No.", width: "12%", cell: (row) => row.batchNumber },
        { id: "product", header: "Product", width: "26%", cell: (row) => `${row.productName}${row.productCode ? ` (${row.productCode})` : ""}` },
        { id: "department", header: "Department", width: "16%", cell: (row) => row.departmentName },
        { id: "schedule", header: "Schedule", width: "9%", cell: (row) => row.scheduleCode },
        { id: "made", header: "Mfg.", width: "8%", cell: (row) => formatMonthYear(row.manufacturingDate) ?? "–" },
        { id: "expires", header: "Exp.", width: "8%", cell: (row) => formatMonthYear(row.expiryDate) ?? "–" },
        { id: "issued", header: "Issued", width: "15%", cell: (row) => `${formatDateTime(row.issuedAt) ?? "–"}${row.isRetired ? " · retired" : ""}` },
      ]} />
      : <PrintTable caption="Issued batches by product" rows={register.byProduct} rowKey={(row) => row.productId} empty="No BMR or BPR was issued for these filters."
        columns={[
          { id: "product", header: "Product", width: "34%", cell: (row) => `${row.productName}${row.productCode ? ` (${row.productCode})` : ""}` },
          { id: "department", header: "Department", width: "22%", cell: (row) => row.departmentName },
          { id: "batches", header: "Batches issued", width: "12%", align: "right", cell: (row) => String(row.batches) },
          { id: "retired", header: "Of which retired", width: "12%", align: "right", cell: (row) => row.retired ? String(row.retired) : "–" },
          { id: "first", header: "First issued", width: "10%", cell: (row) => formatDate(row.firstIssuedAt) ?? "–" },
          { id: "last", header: "Last issued", width: "10%", cell: (row) => formatDate(row.lastIssuedAt) ?? "–" },
        ]}
        footer={<tr><th scope="row" colSpan={2}>Total</th><td style={{ textAlign: "right" }}>{totalBatches}</td><td colSpan={3} /></tr>} />}
    <PrintSignatures roles={["Prepared by (QA)", "Checked by", "Approved by"]} />
  </div>;
}
