import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import type { ReservationRepairRow } from "../../schemas/reservation-repair";

const column = dataTableColumns<ReservationRepairRow>();
const columns = column.columns([
  column.accessor("materialCode", { header: "Material", cell: ({ row }) => <div className="min-w-0 break-words">
    <p className="font-medium">{row.original.materialCode}</p><p className="text-xs text-muted-foreground">{row.original.materialName}</p>
    <p className="text-xs text-muted-foreground">{row.original.requisitionCode}</p></div> }),
  column.accessor("quantity", { header: "Reserved", size: 120,
    cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit)?.text }),
  column.accessor("oldBatchNumber", { header: "Previous batch / shelf", cell: ({ row }) => <div className="min-w-0 break-words">
    <p>{row.original.oldBatchNumber || row.original.oldBatchId}</p><p className="text-xs text-muted-foreground">{row.original.oldShelf || "No shelf recorded"}</p></div> }),
  column.display({ id: "replacement", header: "Replacement / available", cell: ({ row }) => <div className="min-w-0 space-y-2 break-words">
    {row.original.candidates.length === 0 ? <p>No eligible replacement</p> : row.original.candidates.map((item) =>
      <div key={`${item.batchId}-${item.shelfId}`}><p className="font-medium">{item.batchNumber || item.batchId}</p>
        <p className="text-xs text-muted-foreground">{item.shelf || item.shelfId} · {toLargestUnit(item.availableQuantity, row.original.unit, "calculated")?.text} available</p></div>)}
  </div> }),
]);

export function ReservationRepairRows({ rows, loading }: { rows: readonly ReservationRepairRow[]; loading: boolean }) {
  return <ListDataTable label="Reservation repair preview" columns={columns} rows={rows} getRowId={(row) => row.reservationId}
    loading={loading} emptyTitle="No reservations to repair" />;
}
