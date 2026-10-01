import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { DraggableDataTable, dataTableColumns } from "@/shared/datatable";
import type { ProcedureStep } from "../../lib/procedure";
import { PartySummary } from "./party-summary";

const column = dataTableColumns<ProcedureStep>();

/** The procedure's steps in order. Dragging a row changes its step number. */
export function ProcedureTable({ steps, loading, error, onRetry, onReorder, onEdit, onRemove, disabled }: {
  steps: readonly ProcedureStep[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onReorder: (steps: ProcedureStep[]) => void;
  onEdit: (step: ProcedureStep) => void;
  onRemove: (step: ProcedureStep) => void;
  disabled: boolean;
}) {
  const columns = useMemo(() => column.columns([
    column.display({ id: "step", header: "Step", size: 60, cell: ({ row }) => row.index + 1 }),
    column.accessor((step) => step.operation.label, { id: "operation", header: "Operation", cell: ({ row }) => <div className="break-words">{row.original.operation.label}</div> }),
    column.accessor((step) => step.isCritical ? "Critical" : "Automated", { id: "type", header: "Type", size: 110,
      cell: ({ row }) => <Badge variant={row.original.isCritical ? "default" : "secondary"}>{row.original.isCritical ? "Critical" : "Automated"}</Badge> }),
    column.accessor((step) => step.workCenters.map((center) => center.label).join(", ") || "–", { id: "workCenters", header: "Work centers",
      cell: ({ getValue }) => <div className="break-words">{getValue()}</div> }),
    column.accessor((step) => step.estimatedTime || "–", { id: "time", header: "Estimated time", size: 140 }),
    column.display({ id: "parties", header: "Responsible", cell: ({ row }) => <PartySummary parties={row.original.parties} operation={row.original.operation.label} /> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.operation.label}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, onSelect: () => onEdit(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [onEdit, onRemove]);
  return <DraggableDataTable label="Procedure" columns={columns} rows={steps} getRowId={(step) => step.key} loading={loading} error={error}
    onRetry={onRetry} disabled={disabled} describeRow={(step) => step.operation.label} onReorder={(next) => onReorder(next)}
    emptyTitle="No steps yet" emptyDescription="Add the operations this product goes through, in order, then save." />;
}
