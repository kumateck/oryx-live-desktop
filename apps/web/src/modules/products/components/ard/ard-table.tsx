import { useMemo } from "react";
import { Paperclip, Pencil } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { ardStageLabel } from "../../lib/ard";
import type { SavedArd } from "../../schemas/ard-schema";

const column = dataTableColumns<SavedArd>();
const dash = "–";

export function ArdTable({ ards, loading, error, onRetry, onEdit }: {
  ards: readonly SavedArd[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Absent for users who may not edit analytical raw data. */
  onEdit: ((ard: SavedArd) => void) | null;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((ard) => ardStageLabel(ard.stage), { id: "stage", header: "Stage", size: 120 }),
    column.accessor((ard) => ard.specNumber || dash, { id: "spec", header: "Specification number", cell: ({ row }) =>
      <Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/qc/product-analytical-raw-data/${row.original.id}`}>{row.original.specNumber || "Open"}</Link> }),
    column.accessor((ard) => ard.productStandardTestProcedure?.stpNumber || dash, { id: "stp", header: "STP number" }),
    column.accessor((ard) => ard.form?.name || dash, { id: "form", header: "Template form" }),
    column.accessor((ard) => ard.attachments.length, { id: "files", header: "Files", size: 80, cell: ({ row }) => row.original.attachments.length
      ? <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5 text-muted-foreground" />{row.original.attachments.length}</span> : dash }),
    ...(onEdit ? [column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 60, cell: ({ row }) =>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${ardStageLabel(row.original.stage)} analytical raw data`} onClick={() => onEdit(row.original)}><Pencil /></Button> })] : []),
  ]), [onEdit]);
  return <ListDataTable label="Analytical raw data" columns={columns} rows={ards} getRowId={(ard) => ard.id} loading={loading} error={error} onRetry={onRetry}
    emptyTitle="No analytical raw data yet" emptyDescription="Add one for each test stage the product is tested at." />;
}
