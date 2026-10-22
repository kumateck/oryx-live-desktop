import { useState } from "react";
import { Play, Lock } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { CycleStatus, type Cycle } from "@/shared/performance/contracts";
import { useCycleCommand } from "../hooks/use-cycle-command";
function Transition({ row, onClose }: { row: Cycle; onClose: () => void }) {
  const command = useCycleCommand(() => {});
  const activate = row.status === CycleStatus.Draft;
  return (
    <ConfirmActionDialog
      title={activate ? "Activate performance cycle" : "Close performance cycle"}
      description={`${row.name}: ${row.goalCount} goals and ${row.reviewCount} reviews. ${activate ? "Activate this draft so goals and reviews can begin." : "Close this cycle after reconciling every review. Live prevents new goals and reviews for closed cycles. This cannot be reopened here."}`}
      require={{ kind: "all", permissions: ["CanManagePerformanceCycles", "CanViewPerformanceCycles"] }}
      destructive={!activate}
      confirmLabel={activate ? "Activate cycle" : "Close cycle"}
      busyLabel="Updating…"
      onClose={onClose}
      onConfirm={() => command.run({ kind: "status", original: row, status: activate ? CycleStatus.Active : CycleStatus.Closed })}
    />
  );
}
export function CycleActions({ row }: { row: Cycle }) {
  const [snapshot, setSnapshot] = useState<Cycle | null>(null);
  return (
    <>
      <TableMenu
        label={`Actions for ${row.name}`}
        items={
          row.status === CycleStatus.Closed
            ? []
            : [
                {
                  id: "transition",
                  label: row.status === CycleStatus.Draft ? "Activate cycle" : "Close cycle",
                  icon: row.status === CycleStatus.Draft ? Play : Lock,
                  require: "CanManagePerformanceCycles",
                  onSelect: () => setSnapshot(structuredClone(row)),
                },
              ]
        }
      />
      {snapshot ? <Transition row={snapshot} onClose={() => setSnapshot(null)} /> : null}
    </>
  );
}
