import { lazy, Suspense, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { useConfigCommand } from "../hooks/use-config-command";
import type { ConfigRecord } from "../schemas/contracts";
const GradeDialog = lazy(() => import("./grade-dialog").then((module) => ({ default: module.GradeDialog })));
function Delete({ record, onClose }: { record: ConfigRecord; onClose: () => void }) {
  const command = useConfigCommand(record.kind, record, () => {});
  return (
    <ConfirmActionDialog
      title="Delete payroll configuration"
      description="This removes the configuration from future calculations. Existing processed payroll snapshots are retained by the server. Review any open payroll runs before proceeding."
      require="CanManagePayrollConfiguration"
      confirmLabel="Delete configuration"
      busyLabel="Deleting…"
      onClose={onClose}
      onConfirm={() => command.run("delete")}
    />
  );
}
export function ConfigActions({ record }: { record: ConfigRecord }) {
  const [selected, setSelected] = useState<{ action: "edit" | "delete"; record: ConfigRecord } | null>(null);
  return (
    <>
      <TableMenu
        label="Payroll configuration actions"
        items={[
          ...(record.kind === "grade"
            ? [
                {
                  id: "edit",
                  label: "Edit pay grade",
                  icon: Pencil,
                  require: "CanManagePayrollConfiguration",
                  onSelect: () => setSelected({ action: "edit", record: structuredClone(record) }),
                },
              ]
            : []),
          {
            id: "delete",
            label: "Delete configuration",
            icon: Trash2,
            destructive: true,
            require: "CanManagePayrollConfiguration",
            onSelect: () => setSelected({ action: "delete", record: structuredClone(record) }),
          },
        ]}
      />
      {selected ? (
        selected.action === "edit" ? (
          <Suspense fallback={<p role="status">Loading grade editor…</p>}><GradeDialog original={selected.record} onClose={() => setSelected(null)} /></Suspense>
        ) : (
          <Delete record={selected.record} onClose={() => setSelected(null)} />
        )
      ) : null}
    </>
  );
}
