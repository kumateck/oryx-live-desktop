import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1CostingListPricesQuery, type ListPrice } from "../api/costing-api";
import { useCurrencyOptions } from "../hooks/use-costing-choices";
import { costingAudit, costingPermissions, currencyName, priceIn } from "../lib/costing";
import { CostingTabs } from "./costing-tabs";
import { ListPriceDialog } from "./list-price-dialog";

const column = dataTableColumns<ListPrice>();

/** Every product's list price, in the currency it is priced in. */
export function ListPricesPage() {
  const search = usePageSearch("products", false);
  const table = useServerTable({ pageSize: 30, resetKey: search });
  const query = useGetApiV1CostingListPricesQuery({ ...costingAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const rows = useMemo(() => query.currentData?.data ?? [], [query.currentData]);
  const meta = pageMeta(query.currentData, table, rows.length);
  const currencies = useCurrencyOptions();
  const [editing, setEditing] = useState<ListPrice | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.productName ?? "", { id: "product", header: "Product", cell: ({ row }) => <span className="break-words">{row.original.productName ?? "Unnamed product"}{row.original.productCode ? <span className="text-muted-foreground"> · {row.original.productCode}</span> : null}</span> }),
    column.accessor((row) => row.price ?? 0, { id: "price", header: "List price", cell: ({ row }) => row.original.pricedAt ? <span className="font-medium">{priceIn(row.original.price, row.original.currency)}</span> : <span className="text-muted-foreground">Not priced</span> }),
    column.accessor((row) => currencyName(row.currency), { id: "currency", header: "Priced in" }),
    column.accessor((row) => row.priceUoM ?? "", { id: "unit", header: "Per", cell: ({ row }) => row.original.priceUoM ?? "–" }),
    column.accessor((row) => row.pricedAt ?? "", { id: "since", header: "Since", cell: ({ row }) => formatDate(row.original.pricedAt) ?? "–" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.productName ?? "product"}`}
      items={[{ id: "price", label: "Set price", icon: Pencil, require: costingPermissions.manage, onSelect: () => setEditing(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <PageHeader title="Costing" crumbs={[{ label: "Finance" }, { label: "Costing" }]} />
    <CostingTabs />
    <ServerDataTable label="List prices" columns={columns} rows={rows} getRowId={(row) => row.productId ?? ""} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()} onRowOpen={(row) => setEditing(row)}
      emptyTitle="No matching products" emptyDescription="Change the search, or add the product under Products first." />
    <p className="text-sm text-muted-foreground">A customer's agreement for a product and packing style takes the place of its list price. Prices are kept in the currency they were set in and are never converted.</p>
    {editing ? <ListPriceDialog key={editing.productId} item={editing} currencies={currencies.options} onClose={() => setEditing(null)} /> : null}
  </section>;
}
