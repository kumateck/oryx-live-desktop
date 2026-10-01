import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { useGetApiV1ProductByProductIdRoutesQuery } from "../../api/product-api";
import { useParsedQuery } from "../../hooks/use-parsed-query";
import { audit } from "../../lib/product-access";
import { operationActionLabel } from "../../lib/product-detail";
import { routeListSchema, type ProductRoute } from "../../schemas/product-detail-schema";

const dash = "–";
const column = dataTableColumns<ProductRoute>();
const names = (values: readonly string[]) => values.length ? values.join(", ") : dash;
const columns = column.columns([
  column.accessor((route) => route.order ?? "", { id: "step", header: "Step", size: 70 }),
  column.accessor((route) => route.operation ?? dash, { id: "operation", header: "Operation", cell: ({ row }) =>
    <span className="flex flex-wrap items-center gap-2">{row.original.operation ?? dash}{row.original.isCritical ? <Badge variant="destructive">Critical</Badge> : null}</span> }),
  column.accessor((route) => names(route.workCenters), { id: "workCenters", header: "Work centers" }),
  column.accessor((route) => names(route.resources), { id: "resources", header: "Resources" }),
  column.accessor((route) => route.estimatedTime ?? dash, { id: "time", header: "Estimated time", size: 120 }),
  // Listed in the row rather than behind a hover card, so everyone responsible is visible and printable.
  column.display({ id: "personnel", header: "Responsible", cell: ({ row }) => row.original.personnel.length
    ? <ul className="space-y-1">{row.original.personnel.map((person, index) => <li key={index} className="break-words">
      <span className="font-medium">{person.name ?? dash}</span>
      <span className="text-muted-foreground"> · {person.kind === "role" ? "Role" : "User"}
        {operationActionLabel(person.action) ? ` · ${operationActionLabel(person.action)}` : ""}{person.stpNumber ? ` · ${person.stpNumber}` : ""}</span>
    </li>)}</ul> : <span className="text-muted-foreground">No one assigned</span> }),
]);

export function ProcedureTab({ productId }: { productId: string }) {
  const result = useParsedQuery(useGetApiV1ProductByProductIdRoutesQuery({ ...audit, productId }), routeListSchema);
  return <ListDataTable label="Production procedure" columns={columns} rows={result.rows} getRowId={(route) => route.id} loading={result.loading}
    refreshing={result.refreshing} error={result.error} onRetry={result.onRetry} emptyTitle="No procedure steps yet" />;
}
