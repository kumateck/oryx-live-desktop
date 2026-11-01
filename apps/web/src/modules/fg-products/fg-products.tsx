import { useMemo } from "react";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router";
import { PackageOpen } from "lucide-react";
import { productsApi } from "@/shared/api/generated/products";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { usePageSearch } from "@/shared/search/page-search";

export const fgProductsPath = "/warehouse/fg-products";
export const fgProductPath = (id: string) => `${fgProductsPath}/${id}`;
export const fgProductsAudit = { module: "Warehouse", subModule: "Products" } as const;
const viewPermission = "CanViewApprovedProducts";

/** Beta-lactam and non-beta-lactam products are made apart and listed apart. */
export type Division = 0 | 1;
export const divisionLabels: Record<Division, string> = { 0: "Beta-lactam", 1: "Non-beta-lactam" };
const divisionTabs = [{ value: 0 }, { value: 1 }] as const;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const productRows = z.array(z.object({ id: z.string().nullish(), code: text, name: text, packageStyle: text, category: z.object({ name: text }).nullish(), department: z.object({ name: text }).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, code: entry.code, name: entry.name ?? "Unnamed product", packageStyle: entry.packageStyle, category: entry.category?.name ?? null, department: entry.department?.name ?? null }] : []));
type FgProduct = z.infer<typeof productRows>[number];

/** The division open, kept in the address as `?division=` so it survives reload and can be shared. */
export function divisionFrom(value: string | null): Division {
  return value === "1" ? 1 : 0;
}

const column = dataTableColumns<FgProduct>();
const dash = <span className="text-muted-foreground">–</span>;
const columns = column.columns([
  column.accessor("name", { header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
  column.accessor((row) => row.category ?? "", { id: "category", header: "Category", size: 180, cell: ({ row }) => row.original.category ?? dash }),
  column.accessor((row) => row.packageStyle ?? "", { id: "packageStyle", header: "Pack description", cell: ({ row }) => <span className="break-words">{row.original.packageStyle ?? "–"}</span> }),
  column.accessor((row) => row.department ?? "", { id: "department", header: "Made by", size: 220, cell: ({ row }) => <span className="break-words">{row.original.department ?? "–"}</span> }),
  column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
    { id: "packing", label: "Manage packing styles", icon: PackageOpen, require: viewPermission, to: fgProductPath(row.original.id) },
  ]} /> }),
]);

/** Every product of a division, whichever department makes it; open one to manage its packing styles. */
export function FgProductsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const division = divisionFrom(params.get("division"));
  const select = (next: Division) => setParams((current) => { const updated = new URLSearchParams(current); updated.set("division", String(next)); return updated; }, { replace: true });
  const search = usePageSearch("products");
  const table = useServerTable({ pageSize: 30, resetKey: `${division}|${search}` });
  const query = productsApi.useGetApiV1ProductQuery({ ...fgProductsAudit, division, page: table.page, pageSize: table.pageSize, ...(search.trim() ? { searchQuery: search.trim() } : {}) });
  const parsed = useMemo(() => query.data ? productRows.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = parsed?.success ? parsed.data : [];
  const meta = pageMeta(query.data, table, rows.length);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Products</h1></div>
      <KindSwitch tabs={divisionTabs} kind={division} onSelect={select} labels={divisionLabels} label="Division" />
    </div>
    <ServerDataTable label="Products" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(fgProductPath(row.id))} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned products the app could not read." : null}
      emptyTitle={search.trim() ? "No products match this search" : `No ${divisionLabels[division].toLowerCase()} products`} emptyDescription={search.trim() ? "Search by product name or code." : "Products of this division appear here once they are created."} />
  </section>;
}
