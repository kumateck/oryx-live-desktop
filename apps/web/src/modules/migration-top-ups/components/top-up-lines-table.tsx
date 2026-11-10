import { useMemo } from "react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { showMonth, topUpPermissions, type TopUpLine } from "../lib/top-up";

const column = dataTableColumns<TopUpLine>();

/** The lots entered so far, before they are submitted. */
export function TopUpLinesTable({ lines, disabled, onEdit, onRemove }: {
  lines: TopUpLine[]; disabled: boolean; onEdit: (line: TopUpLine) => void; onRemove: (line: TopUpLine) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.material.code, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0 break-words">
      <div className="font-medium">{row.original.material.code}</div><div className="text-xs text-muted-foreground">{row.original.material.name} · {materialKindLabels[row.original.kind]}</div></div> }),
    column.accessor("batchNumber", { header: "Batch / AR", cell: ({ row }) => <div className="break-words">{row.original.batchNumber || <span className="text-muted-foreground">No batch number</span>}
      <div className="text-xs text-muted-foreground">{row.original.arNumber || "No AR number"}</div></div> }),
    column.accessor("quantity", { header: "Quantity", size: 130, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "entered")?.text ?? `${row.original.quantity} ${row.original.unit}` }),
    column.accessor((row) => row.shelf.label, { id: "shelf", header: "Shelf", cell: ({ row }) => <span className="break-words">{row.original.shelf.label}</span> }),
    column.accessor((row) => row.expiry ?? "", { id: "dates", header: "Mfg / expiry / retest", size: 170, cell: ({ row }) => <div className="text-xs">
      <div>Mfg {showMonth(row.original.manufactured)}</div><div>Exp {showMonth(row.original.expiry)}</div><div>Retest {showMonth(row.original.retest)}</div></div> }),
    column.display({ id: "actions", header: () => <TableMenuHeader />, size: 48, cell: ({ row }) => <TableMenu
      label={`Actions for ${row.original.material.code} batch ${row.original.batchNumber}`} disabled={disabled} items={[
        { id: "edit", label: "Edit line", require: topUpPermissions.upload, onSelect: () => onEdit(row.original) },
        { id: "remove", label: "Remove line", require: topUpPermissions.upload, destructive: true, onSelect: () => onRemove(row.original) },
      ]} /> }),
  ]), [disabled, onEdit, onRemove]);
  return <ClientDataTable label="Stock lines to submit" columns={columns} rows={lines} getRowId={(row) => row.key} fill={false}
    emptyTitle="No stock lines yet" emptyDescription="Add each material batch you received, then submit the list for approval." />;
}
