import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu } from "@/shared/actions";
import { toLargestUnit } from "@/shared/units/quantity";
import { useTransferDecision } from "../hooks/use-transfer-decision";
import { decisionProblem, TransferDirection, transferPath, transferPermissions, type Transfer } from "../lib/transfers";

export function TransferActions({ transfer, direction, detail = false }: { transfer: Transfer; direction: TransferDirection; detail?: boolean }) {
  const [decision, setDecision] = useState<{ kind: "approve" | "reject"; evidence: Transfer } | null>(null);
  const action = useTransferDecision();
  const blocked = decisionProblem(transfer, action.departmentId);
  const items = [
    ...(!detail ? [{ id: "view", label: "View transfer", icon: Eye, to: transferPath(transfer.id, direction) }] : []),
    ...(direction === TransferDirection.Incoming ? [
      { id: "approve", label: "Approve", icon: Check, require: transferPermissions.decide, disabled: blocked !== null, ...(blocked ? { disabledReason: blocked } : {}), onSelect: () => setDecision({ kind: "approve", evidence: structuredClone(transfer) }) },
      { id: "reject", label: "Reject", icon: X, require: transferPermissions.decide, destructive: true, disabled: blocked !== null, ...(blocked ? { disabledReason: blocked } : {}), onSelect: () => setDecision({ kind: "reject", evidence: structuredClone(transfer) }) },
    ] : []),
  ];
  return <>
    {detail && direction === TransferDirection.Outgoing ? <Button asChild variant="outline"><Link to="/production/stock-transfer-requests?type=1">Back to transfers</Link></Button> : <TableMenu label={`Actions for ${transfer.material?.name ?? "transfer"}`} items={items} />}
    {decision ? <ConfirmActionDialog require={{ kind: "all", permissions: [transferPermissions.incoming, transferPermissions.decide] }}
      destructive={decision.kind === "reject"} title={`${decision.kind === "approve" ? "Approve" : "Reject"} this stock transfer?`}
      description={`${toLargestUnit(decision.evidence.quantity, decision.evidence.uoM?.symbol)?.text ?? "Unrecorded quantity"} of ${decision.evidence.material?.name ?? "material"} requested by ${decision.evidence.toDepartment?.name ?? "another department"}. ${decision.kind === "approve" ? "Approval allows the warehouse to issue stock; it does not issue it." : "The request will be rejected."}`}
      confirmLabel={decision.kind === "approve" ? "Approve transfer" : "Reject transfer"} busyLabel="Sending decision…" onClose={() => setDecision(null)} onConfirm={() => action.decide(decision.evidence, decision.kind)} /> : null}
  </>;
}
