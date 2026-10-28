import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { mayChangeStaff, staffDetail, staffRoot, staffPermissions as p, type StaffRequest } from "../lib/staff";
import { useStaffCommand } from "../hooks/use-staff-command";
function Delete({ row, onClose, onDeleted }: { row: StaffRequest; onClose: () => void; onDeleted: () => void }) {
  const command = useStaffCommand(row, "delete", onDeleted);
  return (
    <ConfirmActionDialog
      title="Delete staff requisition"
      description={`Remove the unapproved request for ${row.staffRequired ?? "the requested"} employees. The server retains its deletion audit record.`}
      confirmLabel="Delete request"
      busyLabel="Deleting…"
      require={p.delete}
      onClose={onClose}
      onConfirm={() => command.run()}
    />
  );
}
export function StaffActions({ row, detail = false, onDeleted = () => {} }: { row: StaffRequest; detail?: boolean; onDeleted?: () => void }) {
  const [deleting, setDeleting] = useState<StaffRequest | null>(null);
  if (!row.id) return null;
  return (
    <>
      <TableMenu
        label="Staff requisition actions"
        items={[
          ...(!detail ? [{ id: "details", label: "View details", icon: Eye, require: p.view, to: staffDetail(row.id) }] : []),
          {
            id: "edit",
            label: "Edit request",
            icon: Pencil,
            require: p.edit,
            to: `${staffRoot}/${encodeURIComponent(row.id)}/edit`,
            disabled: !mayChangeStaff(row),
            disabledReason: "Only new or pending requests can be edited.",
          },
          {
            id: "delete",
            label: "Delete request",
            icon: Trash2,
            require: p.delete,
            destructive: true,
            disabled: !mayChangeStaff(row),
            disabledReason: "Closed requests retain their approval history.",
            onSelect: () => setDeleting(structuredClone(row)),
          },
        ]}
      />
      {deleting ? <Delete row={deleting} onClose={() => setDeleting(null)} onDeleted={onDeleted} /> : null}
    </>
  );
}
