import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePageSearch } from "@/shared/search/page-search";
import { usePriceListLinesQuery } from "../api/price-list-api";
import { editablePriceList, priceListAudit, priceListKeys, priceListLineSchema, type PriceListDetail, type PriceListLine } from "../lib/price-lists";
import { priceIn } from "../lib/costing";
import { PriceListLineDialog } from "./price-list-line-dialog";

const column = dataTableColumns<PriceListLine>();
export function PriceListLines({ revision, onChanged }: { revision: PriceListDetail; onChanged: () => void }) {
  const search = usePageSearch("products and packing styles");
  const table = useServerTable({ pageSize: 30, resetKey: `${revision.id}|${search}` });
  const query = usePriceListLinesQuery({ ...priceListAudit, id: revision.id, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.currentData ? priceListLineSchema.array().safeParse(query.currentData.data ?? []) : null, [query.currentData]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.currentData, table, rows.length);
  const { has } = useAccess();
  const editable = editablePriceList(revision) && has(priceListKeys.edit);
  const [editing, setEditing] = useState<PriceListLine | "new" | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.productCode ?? "", { id: "code", header: "Product code", size: 120 }),
    column.accessor("productName", { header: "Product" }),
    column.accessor("packingStyle", { header: "Packing style" }),
    column.accessor((row) => row.previousPrice ?? -1, { id: "previous", header: "Previous price", cell: ({ row }) => row.original.previousPrice === null ? "–" : priceIn(row.original.previousPrice, { symbol: row.original.previousCurrencySymbol }) }),
    column.accessor((row) => row.price ?? -1, { id: "price", header: "Price per pack", cell: ({ row }) => row.original.price === null ? "Not priced"
      : priceIn(row.original.price, { name: row.original.currencyName, symbol: row.original.currencySymbol }) }),
    ...(editable ? [column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.productName} / ${row.original.packingStyle}`}
      items={[{ id: "edit", label: "Change price", icon: Pencil, require: priceListKeys.edit, onSelect: () => setEditing(row.original) }]} /> })] : []),
  ]), [editable]);
  return <section className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Product pack prices</h2>
      {editable ? <Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Add product pack</Button> : null}</div>
    <ServerDataTable label="Product pack prices" columns={columns} rows={rows} getRowId={(row) => row.id} maxHeight="60vh"
      page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The revision's prices could not be read." : null}
      emptyTitle="No matching product pack prices" emptyDescription="Search by product name, code or packing style." />
    {editing ? <PriceListLineDialog revision={revision} line={editing === "new" ? null : editing} onClose={() => setEditing(null)}
      onSaved={() => { onChanged(); void query.refetch(); }} /> : null}
  </section>;
}
