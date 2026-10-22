import { useRef, useState } from "react";
import { z } from "zod";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { api } from "@/shared/api/base-api";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { stockRule } from "@/shared/inventory/stores";
import { itemSchema, type InventoryItem } from "@/shared/inventory/contracts";
import { stockAudit as audit, ledgerRows } from "../schemas/stock";
import { DamageKind } from "../schemas/stock";
export const damageValues = z.object({ quantity: z.number().int().positive().max(2147483647), remarks: z.string().trim().max(10000) });
export type DamageValues = z.infer<typeof damageValues>;
const report = z.object({ id: z.uuid(), itemId: z.uuid(), quantityDamaged: z.number().int(), damageStatus: z.union([z.literal(0), z.literal(1)]) });
export function useDamageReport(original: InventoryItem, kind: DamageKind, done: () => void) {
  const gate = usePermissionAction(stockRule(original.store, "damage"));
  const sent = useRef(false);
  const running = useRef(false);
  const dispatch = useApiDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = inventoryApi.useLazyGetApiV1ItemsByIdQuery();
  const [ledger] = inventoryApi.useLazyGetApiV1ItemsByItemCodeTransactionsQuery();
  const [create] = warehouseApi.usePostApiV1DamagedGoodsMutation();
  const [saved] = warehouseApi.useLazyGetApiV1DamagedGoodsByIdQuery();
  const run = async (v: DamageValues) => {
    const fail = (m: string) => setError(m);
    if (running.current) return;
    const denied = gate.check();
    if (denied) return fail(denied);
    if (sent.current) return fail("A report was already sent. Inspect stock and the damage register before another attempt.");
    const values = damageValues.safeParse(v);
    if (!values.success) return fail("Enter a positive whole-number quantity and valid remarks.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before reporting stock.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const fresh = itemSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
      if (JSON.stringify(fresh) !== JSON.stringify(original) || !fresh.isActive) return fail("The item or available stock changed. Reopen the report.");
      if (v.quantity > fresh.availableQuantity) return fail("The quantity exceeds current available stock.");
      const before = ledgerRows.parse(await ledger({ ...audit, itemCode: fresh.code }, false).unwrap());
      if (before.some((r) => r.itemCode !== fresh.code) || before[0]?.totalBalance !== fresh.availableQuantity)
        return fail("The ledger and available stock could not be reconciled. No report was sent.");
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The signed-in account changed. Reopen the report.");
      sent.current = true;
      const result = await create({
        ...audit,
        domainEntitiesDamagedStocksCreateDamagedStockRequest: { itemId: fresh.id, damageStatus: kind, quantityDamaged: v.quantity, remarks: v.remarks },
      });
      if ("error" in result) return fail(apiErrorMessage(result.error));
      dispatch(
        api.util.invalidateTags([
          { type: "item", id: fresh.id },
          { type: "item", id: "LIST" },
          { type: "procurement/inventory", id: "LIST" },
        ]),
      );
      const identity = z.uuid().safeParse(result.data);
      if (!identity.success) return fail("The report identity was not confirmed. Inspect stock before reporting again.");
      const [record, current, transactions] = await Promise.all([
        saved({ ...audit, id: identity.data }, false).unwrap(),
        read({ ...audit, id: fresh.id }, false).unwrap(),
        ledger({ ...audit, itemCode: fresh.code }, false).unwrap(),
      ]);
      const confirmed = report.parse(record);
      const item = itemSchema.parse(current);
      const entries = ledgerRows.parse(transactions);
      if (
        confirmed.id !== identity.data ||
        confirmed.itemId !== fresh.id ||
        confirmed.quantityDamaged !== v.quantity ||
        confirmed.damageStatus !== kind ||
        item.id !== fresh.id ||
        item.store !== fresh.store ||
        item.availableQuantity !== fresh.availableQuantity - v.quantity ||
        entries[0]?.totalBalance !== item.availableQuantity
      )
        return fail("The report was sent but its stock effect was not reconciled. Inspect the report and ledger; do not repeat it.");
      done();
    } catch {
      fail(
        sent.current
          ? "The report was not fully confirmed. Inspect stock and the damage register before another attempt."
          : "Current stock and ledger could not be verified. No report was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}
