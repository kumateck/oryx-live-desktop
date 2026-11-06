import { useMemo } from "react";
import { Eye } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { useListWhitePlaceboPreparationsQuery } from "../api/white-placebo-api";
import { audit, path, permissions, preparationStatus, quantity } from "../lib/white-placebo";
import { preparationPageSchema, type Preparation } from "../schemas/white-placebo";

const column = dataTableColumns<Preparation>();
const columns = column.columns([
  column.accessor("batchNumber", { header: "Batch", cell: ({ row }) => <Link className="font-medium underline underline-offset-4" to={`${path}/${row.original.id}`}>{row.original.batchNumber}</Link> }),
  column.display({ id: "recipe", header: "Recipe", cell: ({ row }) => <div className="break-words">{row.original.recipeReference}<span className="block text-muted-foreground">Revision {row.original.recipeRevision}</span></div> }),
  column.display({ id: "output", header: "Output", cell: ({ row }) => <div>{row.original.actualQuantity === null ? "Not weighed" : quantity(row.original.actualQuantity, row.original.unitSymbol)}<span className="block text-muted-foreground">Expected {quantity(row.original.expectedQuantity, row.original.unitSymbol)}</span></div> }),
  column.display({ id: "status", header: "Status", cell: ({ row }) => <Badge variant="outline">{preparationStatus(row.original)}</Badge> }),
  column.accessor("createdAt", { header: "Requested", cell: ({ row }) => formatDate(row.original.createdAt) }),
  column.display({ id: "actions", size: 56, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.batchNumber}`} items={[
    { id: "view", label: "Open preparation", icon: Eye, to: `${path}/${row.original.id}`, require: "CanViewRawMaterialRequisitions" },
  ]} /> }),
]);

export function WhitePlaceboHistoryPage() {
  const search = usePageSearch("White Placebo preparations", false);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useListWhitePlaceboPreparationsQuery({ ...audit, page: table.page, pageSize: table.pageSize, search });
  const parsed = useMemo(() => query.currentData ? preparationPageSchema.safeParse(query.currentData) : null, [query.currentData]);
  const rows = parsed?.success ? parsed.data.items : [];
  return <section className="page-fill"><PageHeader title="White Placebo" crumbs={[]} actions={<>
    <PermissionGuard require={permissions.recipe}><Button asChild variant="outline"><Link to={`${path}/recipe`}>Recipe</Link></Button></PermissionGuard>
    <PermissionGuard require={permissions.create}><Button asChild><Link to={`${path}/new`}>Prepare White Placebo</Link></Button></PermissionGuard>
  </>} />
    <p className="text-sm text-muted-foreground">Prepare from existing materials, record the weighed output, then use released stock in product BOMs.</p>
    <p className="text-sm text-muted-foreground">White Placebo is prepared internally and cannot be purchased.</p>
    <ServerDataTable label="White Placebo preparations" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading}
      page={table.page} pageSize={table.pageSize} totalRows={parsed?.success ? parsed.data.totalRows : 0} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned preparation records the app could not read." : null}
      emptyTitle="No White Placebo preparations" emptyDescription="Set up its approved recipe, then request ingredients to prepare a batch." />
  </section>;
}
