import { useRef, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { overtimeAudit, overtimeEvidence, overtimeDetail, overtimeRoot, overtimePermissions as p, OvertimeStatus, type Overtime } from "../lib/overtime";
function Delete({ row, onClose, onDeleted }: { row: Overtime; onClose: () => void; onDeleted: () => void }) {
  const gate = usePermissionAction(p.delete);
  const running = useRef(false);
  const [read] = hrApi.useLazyGetApiV1OvertimeRequestsByIdQuery();
  const [remove] = hrApi.useDeleteApiV1OvertimeRequestsByIdMutation();
  const confirm = async (): Promise<string | null> => {
    if (running.current) return "Deletion is already being sent.";
    const denied = gate.check();
    if (denied) return denied;
    if (!row.id || row.status !== OvertimeStatus.Pending || !overtimeEvidence(row)) return "Only a verified pending request can be deleted.";
    running.current = true;
    try {
      const result = await read({ ...overtimeAudit, id: row.id }, false);
      if ("error" in result) return apiErrorMessage(result.error);
      if (!result.data || overtimeEvidence(result.data) !== overtimeEvidence(row)) return "This request changed. Review the current record before deleting it.";
      const revoked = gate.check();
      if (revoked) return revoked;
      const deleted = await remove({ ...overtimeAudit, id: row.id });
      if ("error" in deleted) return apiErrorMessage(deleted.error);
      toast.success("Pending overtime request deleted");
      onDeleted();
      return null;
    } finally {
      running.current = false;
    }
  };
  return (
    <ConfirmActionDialog
      title="Delete pending overtime request"
      description={`Remove ${row.code ?? "this request"} from the active register. The server retains its deletion audit record.`}
      confirmLabel="Delete request"
      busyLabel="Deleting…"
      require={p.delete}
      onConfirm={confirm}
      onClose={onClose}
    />
  );
}
export function OvertimeActions({ row, detail = false, onDeleted = () => {} }: { row: Overtime; detail?: boolean; onDeleted?: () => void }) {
  const [deleting, setDeleting] = useState<Overtime | null>(null);
  if (!row.id) return null;
  return (
    <>
      <TableMenu
        label={`Actions for ${row.code ?? "overtime request"}`}
        items={[
          ...(!detail ? [{ id: "details", label: "View details", icon: Eye, to: overtimeDetail(row.id), require: p.view }] : []),
          {
            id: "edit",
            label: "Edit pending request",
            icon: Pencil,
            to: `${overtimeRoot}/${encodeURIComponent(row.id)}/edit`,
            require: p.edit,
            disabled: row.status !== OvertimeStatus.Pending,
            disabledReason: "Only pending requests can be changed.",
          },
          {
            id: "delete",
            label: "Delete pending request",
            icon: Trash2,
            require: p.delete,
            destructive: true,
            disabled: row.status !== OvertimeStatus.Pending,
            disabledReason: "Approved, rejected and expired requests retain their workflow history.",
            onSelect: () => setDeleting(structuredClone(row)),
          },
        ]}
      />
      {deleting ? <Delete row={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} /> : null}
    </>
  );
}
