import { useRef } from "react";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { stockRule } from "@/shared/inventory/stores";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { itemSchema } from "@/shared/inventory/contracts";
import { stockApi, receiptApi } from "../api/stock-api";
import { ReceiptStatus, stockAudit as audit, type StockReceipt } from "../schemas/stock";
import { readReceipts, receiptProblem } from "../lib/receipts";
export function useReceiptDecision(original: StockReceipt, decision: "approve" | "reject") {
  const gate = usePermissionAction(stockRule(original.item.store, decision));
  const sent = useRef(false);
  const [list] = stockApi.useLazyStockRegisterQuery();
  const [read] = inventoryApi.useLazyGetApiV1ItemsByIdQuery();
  const [approve] = receiptApi.usePostApiV1ProcurementInventoryItemsByIdApproveMutation();
  const [reject] = receiptApi.usePostApiV1ProcurementInventoryItemsByIdRejectMutation();
  const run = async (): Promise<string | null> => {
    const denied = gate.check();
    if (denied) return denied;
    if (sent.current) return "A decision was already sent. Inspect the receiving register and stock ledger before another attempt.";
    const actor = sessionUserId();
    if (!actor) return "Sign in before deciding a receipt.";
    try {
      const current = await readReceipts((page) => list({ store: original.item.store, status: ReceiptStatus.Pending, page, pageSize: 100 }, false).unwrap());
      const fresh = current.find((r) => r.id === original.id);
      const problem = receiptProblem(original, fresh, actor);
      if (problem) return problem;
      const before = itemSchema.parse(await read({ ...audit, id: original.itemId }, false).unwrap());
      if (
        before.id !== original.itemId ||
        before.store !== original.item.store ||
        before.code !== original.item.code ||
        before.availableQuantity !== original.item.availableQuantity
      )
        return "The item's current stock changed. Reopen this receipt before deciding.";
      const revoked = gate.check();
      if (revoked) return revoked;
      if (sessionUserId() !== actor) return "The signed-in account changed. Reopen the receipt.";
      sent.current = true;
      const result = await (decision === "approve" ? approve({ ...audit, id: original.id }) : reject({ ...audit, id: original.id }));
      if ("error" in result) return apiErrorMessage(result.error);
      const after = itemSchema.parse(await read({ ...audit, id: original.itemId }, false).unwrap());
      const expected = before.availableQuantity + (decision === "approve" ? original.quantity : 0);
      if (after.id !== before.id || after.store !== before.store || after.availableQuantity !== expected)
        return "The decision was sent, but the resulting stock could not be reconciled. Inspect the current receipt and ledger; do not repeat it.";
      return null;
    } catch {
      return sent.current
        ? "The decision was not fully confirmed. Inspect current receiving and stock state before another attempt."
        : "Current receipt and stock could not be verified. No decision was sent.";
    }
  };
  return { run, allowed: gate.allowed };
}
