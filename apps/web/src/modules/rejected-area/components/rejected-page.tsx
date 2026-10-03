import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { batchNumber } from "@/modules/stock-issue/lib/stock-issue";
import { materialsApi } from "@/shared/api/generated/materials";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { toLargestUnit } from "@/shared/units/quantity";

const { useGetApiV1MaterialRejectsQuery } = materialsApi;
const audit = { module: "Warehouse", subModule: "Rejected Area" } as const;
const permissions: Record<MaterialKind, string> = { 0: "CanViewRejectedRawMaterials", 1: "CanViewRejectedPackagingMaterials" };
const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
/** A batch that quality control rejected, and why. The server sends a page of these, though it publishes a different type. */
export const rejectRowsSchema = z.object({ data: z.array(z.object({ id: z.string().nullish(), createdAt: date, reason: text, materialBatch: z.object({ batchNumber: text, expiryDate: date, totalQuantity: amount, remainingQuantity: amount, supplierName: text,
  manufacturerName: text, uoM: z.object({ symbol: text }).nullish(), material: z.object({ name: text, code: text }).nullish() }).nullish() })).nullish() }).nullish()
  .transform((value) => (value?.data ?? []).map((entry, index) => ({ id: entry.id ?? `reject-${index}`, rejectedAt: entry.createdAt, reason: entry.reason, batchNumber: entry.materialBatch?.batchNumber ?? null, expires: entry.materialBatch?.expiryDate ?? null,
    quantity: entry.materialBatch?.totalQuantity ?? 0, unit: entry.materialBatch?.uoM?.symbol ?? null, materialName: entry.materialBatch?.material?.name ?? "Unnamed material", materialCode: entry.materialBatch?.material?.code ?? null,
    supplier: entry.materialBatch?.supplierName ?? null, manufacturer: entry.materialBatch?.manufacturerName ?? null })));
type Reject = z.infer<typeof rejectRowsSchema>[number];

const column = dataTableColumns<Reject>();
const columns = column.columns([
  column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
  column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => <div><div>{batchNumber(row.original.batchNumber)}</div><div className="text-xs text-muted-foreground">{row.original.expires ? `Expires ${formatMonthYear(row.original.expires) ?? ""}` : "No expiry date"}</div></div> }),
  column.accessor((row) => row.supplier ?? "", { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.supplier ?? "–"}</div>
    <div className="break-words text-xs text-muted-foreground">{row.original.manufacturer ? `Made by ${row.original.manufacturer}` : ""}</div></div> }),
  column.accessor("quantity", { header: "Quantity", size: 140, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
  column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason", cell: ({ row }) => { const reason = richTextToPlain(row.original.reason); return reason ? <span className="break-words">{reason}</span> : <span className="text-muted-foreground">Not recorded</span>; } }),
  column.accessor((row) => row.rejectedAt ?? "", { id: "rejected", header: "Rejected", size: 140, cell: ({ row }) => formatDate(row.original.rejectedAt) ?? "–" }),
]);

/** Batches rejected by quality control, raw or packaging. */
export function RejectedAreaPage() {
  const { kind, select, tabs } = useKindTabs(permissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("rejected materials", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1MaterialRejectsQuery({ ...audit, materialKind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? rejectRowsSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  // The published type is a plain list, so the paging figures are read off the response as it really arrives.
  const meta = pageMeta(query.data as unknown as { totalRecordCount?: number } | undefined, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Rejected area</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Rejected materials" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned rejected batches the app could not read." : null}
      emptyTitle={search.trim() ? "Nothing matches this search" : "No rejected materials"} emptyDescription={search.trim() ? "Search by material or batch number." : "Batches rejected by quality control are listed here."} />
  </section>;
}
