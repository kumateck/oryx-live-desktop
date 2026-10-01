import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { ardStageLabel } from "../../lib/ard";
import { productSpecificationPermissions } from "../../lib/product-access";
import type { SavedSpecification } from "../../schemas/specification-schema";

const column = dataTableColumns<SavedSpecification>();
const dash = "–";

export function SpecificationTable({ specifications, loading, error, onRetry, onEdit }: {
  specifications: readonly SavedSpecification[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (specification: SavedSpecification) => void;
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
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for the ${ardStageLabel(row.original.testStage).toLowerCase()} specification`}
      items={[{ id: "edit", label: "Edit", icon: Pencil, require: productSpecificationPermissions.edit, onSelect: () => onEdit(row.original) }]} /> }),
  ]), [onEdit]);
  return <ListDataTable label="Product specifications" columns={columns} rows={specifications} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry}
    emptyTitle="No specifications yet" emptyDescription="Add one for each test stage the product is tested at." />;
}
