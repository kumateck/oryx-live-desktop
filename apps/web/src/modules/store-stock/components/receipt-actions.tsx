import { useState } from "react";
import { Check, X } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { stockRule } from "@/shared/inventory/stores";
import type { StockReceipt } from "../schemas/stock";
import { useReceiptDecision } from "../hooks/use-receipt-decision";
function Decide({ row, decision, close }: { row: StockReceipt; decision: "approve" | "reject"; close: () => void }) {
  const command = useReceiptDecision(row, decision);
  return (
    <ConfirmActionDialog
      title={decision === "approve" ? "Approve stock receipt" : "Reject stock receipt"}
      description={`${decision === "approve" ? "Accept" : "Reject"} ${row.quantity} of ${row.item.name} from memo ${row.memo?.code ?? row.memoId}? ${decision === "approve" ? "This increases available stock and posts a receipt credit." : "No stock is posted for a rejected receipt."}`}
      require={stockRule(row.item.store, decision)}
      destructive={decision === "reject"}
      confirmLabel={decision === "approve" ? "Approve receipt" : "Reject receipt"}
      busyLabel="Recording decision…"
      onConfirm={command.run}
      onClose={close}
    />
  );
}
export function ReceiptActions({ row }: { row: StockReceipt }) {
  const [choice, setChoice] = useState<{ row: StockReceipt; decision: "approve" | "reject" } | null>(null);
  return (
    <>
      <TableMenu
        label={`Receipt actions for ${row.item.name}`}
        items={[
          {
            id: "approve",
            label: "Approve receipt",
            icon: Check,
            require: stockRule(row.item.store, "approve"),
            onSelect: () => setChoice({ row: structuredClone(row), decision: "approve" }),
          },
          {
            id: "reject",
            label: "Reject receipt",
            icon: X,
            destructive: true,
            require: stockRule(row.item.store, "reject"),
            onSelect: () => setChoice({ row: structuredClone(row), decision: "reject" }),
          },
        ]}
      />
      {choice ? <Decide key={`${choice.row.id}:${choice.decision}`} row={choice.row} decision={choice.decision} close={() => setChoice(null)} /> : null}
    </>
  );
}
