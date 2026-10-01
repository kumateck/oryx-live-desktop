import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { ardStageLabel } from "../../lib/ard";
import type { SavedSpecification } from "../../schemas/specification-schema";

const column = dataTableColumns<SavedSpecification>();
const dash = "–";

export function SpecificationTable({ specifications, loading, error, onRetry, onEdit }: {
  specifications: readonly SavedSpecification[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Absent for users who may not edit specifications. */
  onEdit: ((specification: SavedSpecification) => void) | null;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((item) => ardStageLabel(item.testStage), { id: "stage", header: "Stage", size: 120 }),
    column.accessor((item) => item.specificationNumber || dash, { id: "number", header: "Specification number", cell: ({ row }) =>
      <Link className="font-medium text-primary underline-offset-2 hover:underline" to={`/qc/product-specification/${row.original.id}/details`}>{row.original.specificationNumber || "Open"}</Link> }),
    column.accessor((item) => item.form?.name || dash, { id: "form", header: "Template" }),
    column.accessor((item) => formatDate(item.effectiveDate) ?? dash, { id: "effective", header: "Effective" }),
    column.accessor((item) => formatDate(item.reviewDate) ?? dash, { id: "review", header: "Revision date" }),
    column.accessor((item) => item.revisionNumber || dash, { id: "revision", header: "Revision", size: 100 }),
    column.accessor((item) => item.supersedesNumber || dash, { id: "supersedes", header: "Supersedes" }),
    ...(onEdit ? [column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 60, cell: ({ row }) =>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Edit ${ardStageLabel(row.original.testStage)} specification`} onClick={() => onEdit(row.original)}><Pencil /></Button> })] : []),
  ]), [onEdit]);
  return <ListDataTable label="Product specifications" columns={columns} rows={specifications} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry}
    emptyTitle="No specifications yet" emptyDescription="Add one for each test stage the product is tested at." />;
}
