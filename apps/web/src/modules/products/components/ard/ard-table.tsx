import { useMemo } from "react";
import { Paperclip, Pencil } from "lucide-react";
import { Link } from "react-router";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { ardStageLabel } from "../../lib/ard";
import { productArdPermissions } from "../../lib/product-access";
import type { SavedArd } from "../../schemas/ard-schema";

const column = dataTableColumns<SavedArd>();
const dash = "–";

export function ArdTable({ ards, loading, error, onRetry, onEdit }: {
  ards: readonly SavedArd[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (ard: SavedArd) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((ard) => ardStageLabel(ard.stage), { id: "stage", header: "Stage", size: 120 }),
    column.accessor((ard) => ard.specNumber || dash, { id: "spec", header: "Specification number", cell: ({ row }) =>
      <Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/qc/product-analytical-raw-data/${row.original.id}`}>{row.original.specNumber || "Open"}</Link> }),
    column.accessor((ard) => ard.productStandardTestProcedure?.stpNumber || dash, { id: "stp", header: "STP number" }),
    column.accessor((ard) => ard.form?.name || dash, { id: "form", header: "Template form" }),
    column.accessor((ard) => ard.attachments.length, { id: "files", header: "Files", size: 80, cell: ({ row }) => row.original.attachments.length
      ? <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5 text-muted-foreground" />{row.original.attachments.length}</span> : dash }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for the ${ardStageLabel(row.original.stage).toLowerCase()} analytical raw data`}
      items={[{ id: "edit", label: "Edit", icon: Pencil, require: productArdPermissions.edit, onSelect: () => onEdit(row.original) }]} /> }),
  ]), [onEdit]);
  return <ListDataTable label="Analytical raw data" columns={columns} rows={ards} getRowId={(ard) => ard.id} loading={loading} error={error} onRetry={onRetry}
    emptyTitle="No analytical raw data yet" emptyDescription="Add one for each test stage the product is tested at." />;
}
