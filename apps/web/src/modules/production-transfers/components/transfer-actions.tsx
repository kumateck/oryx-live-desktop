import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, ReasonDialog, TableMenu } from "@/shared/actions";
import { toLargestUnit } from "@/shared/units/quantity";
import { useTransferDecision } from "../hooks/use-transfer-decision";
import { decisionProblem, TransferDirection, transferPath, transferPermissions, type Transfer } from "../lib/transfers";

export function TransferActions({ transfer, direction, detail = false }: { transfer: Transfer; direction: TransferDirection; detail?: boolean }) {
  const [decision, setDecision] = useState<{ kind: "approve" | "reject"; evidence: Transfer } | null>(null);
  const action = useTransferDecision();
  const blocked = decisionProblem(transfer, action.departmentId);
  const rejectBlocked = decisionProblem(transfer, action.departmentId, "reject");
  const items = [
    ...(!detail ? [{ id: "view", label: "View transfer", icon: Eye, to: transferPath(transfer.id, direction) }] : []),
    ...(direction === TransferDirection.Incoming ? [
      { id: "approve", label: "Approve", icon: Check, require: transferPermissions.decide, disabled: blocked !== null, ...(blocked ? { disabledReason: blocked } : {}), onSelect: () => setDecision({ kind: "approve", evidence: structuredClone(transfer) }) },
      { id: "reject", label: "Reject", icon: X, require: transferPermissions.reject, destructive: true, disabled: rejectBlocked !== null, ...(rejectBlocked ? { disabledReason: rejectBlocked } : {}), onSelect: () => setDecision({ kind: "reject", evidence: structuredClone(transfer) }) },
    ] : []),
  ];
  return <>
    {detail && direction === TransferDirection.Outgoing ? <Button asChild variant="outline"><Link to="/production/stock-transfer-requests?type=1">Back to transfers</Link></Button> : <TableMenu label={`Actions for ${transfer.material?.name ?? "transfer"}`} items={items} />}
    {decision?.kind === "reject" ? <ReasonDialog require={{ kind: "all", permissions: [transferPermissions.incoming, transferPermissions.reject] }}
      title="Reject this stock transfer?" label="Why can't it be supplied?" placeholder="For example: the store holds only 3,743.3 kg of the 20,720 kg asked for."
      description={`${toLargestUnit(decision.evidence.quantity, decision.evidence.uoM?.symbol)?.text ?? "Unrecorded quantity"} of ${decision.evidence.material?.name ?? "material"} requested by ${decision.evidence.toDepartment?.name ?? "another department"}. ${decision.evidence.toDepartment?.name ?? "The requesting department"} sees your reason and can raise a new request.`}
      confirmLabel="Reject transfer" busyLabel="Rejecting…" onClose={() => setDecision(null)} onConfirm={(reason) => action.decide(decision.evidence, "reject", reason)} /> : null}
    {decision?.kind === "approve" ? <ConfirmActionDialog require={{ kind: "all", permissions: [transferPermissions.incoming, transferPermissions.decide] }}
      destructive={false} title="Approve this stock transfer?"
      description={`${toLargestUnit(decision.evidence.quantity, decision.evidence.uoM?.symbol)?.text ?? "Unrecorded quantity"} of ${decision.evidence.material?.name ?? "material"} requested by ${decision.evidence.toDepartment?.name ?? "another department"}. Approval allows the warehouse to issue stock; it does not issue it.`}
      confirmLabel="Approve transfer" busyLabel="Sending decision…" onClose={() => setDecision(null)} onConfirm={() => action.decide(decision.evidence, "approve")} /> : null}
  </>;
}
