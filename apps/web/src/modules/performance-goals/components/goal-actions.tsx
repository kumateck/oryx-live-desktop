import { lazy, Suspense, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogDescription } from "@/components/ui/dialog";
import { goalStatuses, type Goal } from "@/shared/performance/contracts";
import { formatDate } from "@/shared/format/dates";
import { useGoalCommand } from "../hooks/use-goal-command";
const Editor = lazy(() => import("./goal-editor").then((m) => ({ default: m.GoalEditor })));
function DeleteGoal({ row, personal, onClose }: { row: Goal; personal: boolean; onClose: () => void }) {
  const command = useGoalCommand(row, "delete", () => {}, personal);
  return (
    <ConfirmActionDialog
      title="Delete goal"
      description={`Remove “${row.title}” for ${row.employeeName ?? "this employee"}? The server retains a soft-deletion audit record.`}
      require={{ kind: "all", permissions: ["CanDeleteGoal", "CanViewOwnGoals", "CanViewPerformanceCycles", ...(personal ? [] : ["CanViewTeamGoals"])] }}
      confirmLabel="Delete goal"
      busyLabel="Deleting…"
      onClose={onClose}
      onConfirm={() =>
        command.run({
          employeeId: row.employeeId,
          cycleId: row.cycleId,
          title: row.title,
          description: row.description ?? "",
          weight: row.weight,
          targetDate: row.targetDate,
        })
      }
    />
  );
}
/** Row actions for a goal; `self` is set when the signed-in employee is looking at their own goals. */
export function GoalActions({ row, self = null }: { row: Goal; self?: { id: string; name: string } | null }) {
  const personal = Boolean(self);
  const [selected, setSelected] = useState<{ action: "view" | "edit" | "delete"; row: Goal } | null>(null);
  return (
    <>
      <TableMenu
        label={`Actions for ${row.title}`}
        items={[
          {
            id: "view",
            label: "View goal",
            icon: Eye,
            require: personal ? "CanViewOwnGoals" : "CanViewTeamGoals",
            onSelect: () => setSelected({ action: "view", row: structuredClone(row) }),
          },
          {
            id: "edit",
            label: "Edit goal",
            icon: Pencil,
            require: { kind: "all", permissions: ["CanEditGoal", "CanViewPerformanceCycles", ...(personal ? [] : ["CanViewActiveEmployee", "CanViewEmployeeDetails"])] },
            onSelect: () => setSelected({ action: "edit", row: structuredClone(row) }),
          },
          {
            id: "delete",
            label: "Delete goal",
            icon: Trash2,
            destructive: true,
            require: { kind: "all", permissions: ["CanDeleteGoal", "CanViewPerformanceCycles"] },
            onSelect: () => setSelected({ action: "delete", row: structuredClone(row) }),
          },
        ]}
      />
      {selected?.action === "edit" ? (
        <Suspense fallback={<p role="status">Loading goal editor…</p>}>
          <Editor original={selected.row} self={self} onClose={() => setSelected(null)} />
        </Suspense>
      ) : selected?.action === "delete" ? (
        <DeleteGoal row={selected.row} personal={personal} onClose={() => setSelected(null)} />
      ) : selected ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected.row.title}</DialogTitle>
              <DialogDescription>
                {selected.row.employeeName} · {selected.row.cycleName}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
                <dt>Status</dt>
                <dd>{goalStatuses[selected.row.status]}</dd>
                <dt>Weight</dt>
                <dd>{selected.row.weight}%</dd>
                <dt>Progress</dt>
                <dd>{selected.row.progressPercentage}%</dd>
                <dt>Target</dt>
                <dd>{formatDate(selected.row.targetDate)}</dd>
              </dl>
              <h3 className="mt-4 font-semibold">Description</h3>
              <p className="whitespace-pre-wrap break-words">{selected.row.description || "No description"}</p>
              <h3 className="mt-4 font-semibold">Manager comments</h3>
              <p className="whitespace-pre-wrap break-words">{selected.row.managerComments || "No comments"}</p>
            </DialogBody>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
