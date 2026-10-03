import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery } from "../../api/activity-api";
import { activityAudit } from "../../lib/activity-access";
import { extraMaterialStatusLabel } from "../../lib/step-status";
import { extraMaterialRequestsSchema, type ExtraMaterialRequestRow } from "../../schemas/activity-schema";

const column = dataTableColumns<ExtraMaterialRequestRow>();

/** Extra material already asked for on the batch, so the same thing is not requested twice. */
export function EarlierRequests({ batchId }: { batchId: string }) {
  const query = useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery({ ...activityAudit, productionScheduleProductId: batchId });
  const rows = useMemo(() => { const parsed = extraMaterialRequestsSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
    column.accessor((row) => toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? String(row.quantity), { id: "quantity", header: "Quantity", size: 140 }),
    column.accessor((row) => formatDateTime(row.createdAt) ?? "–", { id: "when", header: "Requested", size: 190 }),
    column.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <Badge variant={row.original.status === 2 ? "secondary" : "outline"}>{extraMaterialStatusLabel(row.original.status)}</Badge> }),
  ]), []);
  if (!query.isLoading && rows.length === 0) return null;
  return <section className="min-w-0 space-y-2">
    <h2 className="text-sm font-semibold">Already requested <span className="font-normal text-muted-foreground">({rows.length})</span></h2>
    <ListDataTable label="Extra material already requested" columns={columns} rows={rows} getRowId={(row) => row.id} loading={query.isLoading} emptyTitle="Nothing requested yet" />
  </section>;
}
