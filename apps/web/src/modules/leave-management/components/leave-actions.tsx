import { lazy, Suspense, useState } from "react";
import { Eye, Pencil, RotateCcw, CircleX, RefreshCw } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi } from "../api/leave-api";
import { useLeaveAction } from "../hooks/use-leave-action";
import { detailPath, leaveRoot, leavePermissions as p, leaveAudit, mayEdit, mayCancel, mayRecall, LeaveStatus, employeeName, type Leave } from "../lib/leave";
const ChangeDialog = lazy(() => import("./leave-change-dialog").then((module) => ({ default: module.LeaveChangeDialog })));
function Cancel({ row, onClose }: { row: Leave; onClose: () => void }) {
  const [cancel] = leaveApi.usePostApiV1LeaveRequestByIdCancelMutation();
  const action = useLeaveAction(row, p.cancel, () => {});
  return (
    <ConfirmActionDialog
      title="Cancel approved leave"
      description={`Cancel the future approved request for ${employeeName(row)}. The server records the cancellation and retains its history. Its current implementation does not restore any annual leave deducted for this request; HR must reconcile the balance.`}
      confirmLabel="Cancel leave"
      busyLabel="Cancelling…"
      require={p.cancel}
      onClose={onClose}
      onConfirm={() =>
        action.run(async (fresh, check) => {
          if (!fresh.id || !mayCancel(fresh)) return "Only an approved request starting after today can be cancelled.";
          const revoked = check();
          if (revoked) return revoked;
          const result = await cancel({ ...leaveAudit, id: fresh.id });
          return "error" in result ? apiErrorMessage(result.error) : null;
        }, "Approved leave cancelled")
      }
    />
  );
}
export function LeaveActions({ row, detail = false }: { row: Leave; detail?: boolean }) {
  const [selected, setSelected] = useState<{ kind: "cancel" | "recall" | "reapply"; row: Leave } | null>(null);
  if (!row.id) return null;
  const choose = (kind: "cancel" | "recall" | "reapply") => setSelected({ kind, row: structuredClone(row) });
  return (
    <>
      <TableMenu
        label={`Actions for ${employeeName(row)}`}
        items={[
          ...(!detail ? [{ id: "details", label: "View details", icon: Eye, to: detailPath(row.id), require: p.view }] : []),
          {
            id: "edit",
            label: "Edit details",
            icon: Pencil,
            to: `${leaveRoot}/${encodeURIComponent(row.id)}/edit`,
            require: p.edit,
            disabled: !mayEdit(row),
            disabledReason: "Only pending, rejected or reapplied requests can be edited.",
          },
          ...(mayCancel(row)
            ? [{ id: "cancel", label: "Cancel approved leave", icon: CircleX, require: p.cancel, destructive: true, onSelect: () => choose("cancel") }]
            : []),
          ...(mayRecall(row) ? [{ id: "recall", label: "Recall employee", icon: RotateCcw, require: p.recall, onSelect: () => choose("recall") }] : []),
          ...(row.leaveStatus === LeaveStatus.Rejected
            ? [{ id: "reapply", label: "Reapply rejected request", icon: RefreshCw, require: p.edit, onSelect: () => choose("reapply") }]
            : []),
        ]}
      />
      {selected ? (
        selected.kind === "cancel" ? (
          <Cancel row={selected.row} onClose={() => setSelected(null)} />
        ) : (
          <Suspense fallback={<p role="status">Loading leave action…</p>}>
            <ChangeDialog row={selected.row} kind={selected.kind} onClose={() => setSelected(null)} />
          </Suspense>
        )
      ) : null}
    </>
  );
}
