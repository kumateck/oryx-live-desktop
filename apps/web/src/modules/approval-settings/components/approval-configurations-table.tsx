import { useMemo } from "react";
import { Link } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { ServerDataTable, dataTableColumns, type ServerDataTableProps } from "@/shared/datatable";
import { TableMenu, TableMenuHeader } from "@/shared/actions/table-menu";
import { useAccess } from "@/shared/auth/use-access";
import { delayLabel } from "@/modules/settings-support/forms";
import { approvalDocumentLabel } from "../lib/documents";
import type { ApprovalConfiguration } from "../schemas/approval-settings-schema";
const column = dataTableColumns<ApprovalConfiguration>();
export function ApprovalConfigurationsTable({ onEdit, onRemove, ...props }: Omit<ServerDataTableProps<ApprovalConfiguration>, "columns" | "getRowId"> & { onEdit: (id: string) => void; onRemove: (row: ApprovalConfiguration) => void }) {
  const { has } = useAccess();
  const editable = has("CanEditApprovalWorkflow");
  const columns = useMemo(() => column.columns([
    column.accessor("itemType", { header: "Document", cell: ({ row }) => editable ? <Link className="font-medium underline-offset-4 hover:underline break-words" to={`/settings/approvals/edit/${row.original.id}`}>{approvalDocumentLabel(row.original.itemType)}</Link> : approvalDocumentLabel(row.original.itemType) }),
    column.accessor((row) => row.approvalStages.length, { id: "stages", header: "Stages", size: 80 }),
    column.accessor((row) => [...row.approvalStages].sort((a, b) => a.order - b.order).map((stage) => `${stage.role?.name || stage.user?.name || "Unnamed approver"}${stage.required ? " (required)" : " (optional)"}`).join(" → "), { id: "route", header: "Approval sequence" }),
    column.accessor((row) => delayLabel(row.escalationDuration), { id: "delay", header: "Escalation" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 48, cell: ({ row }) => <TableMenu label={`Actions for ${approvalDocumentLabel(row.original.itemType)}`} items={[
      { id: "edit", label: "Edit workflow", icon: Pencil, require: "CanEditApprovalWorkflow", onSelect: () => onEdit(row.original.id) },
      { id: "remove", label: "Remove workflow", icon: Trash2, require: "CanDeleteApprovals", destructive: true, onSelect: () => onRemove(row.original) },
    ]} /> }),
  ]), [editable, onEdit, onRemove]);
  return <ServerDataTable {...props} columns={columns} getRowId={(row) => row.id} />;
}
