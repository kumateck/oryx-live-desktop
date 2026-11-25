import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const quantity = z.number().finite();
export const stockTraceStates = { store: 0, reserved: 1, floor: 2, consumed: 3, transit: 4 } as const;
export const stockTraceLabels: Record<number, string> = { 0: "On shelves", 1: "Reserved", 2: "On production floor", 3: "Consumed", 4: "Awaiting shelf receipt" };
const row = z.object({ id: z.string(), materialBatchId: z.string(), materialBatchNumber: text, state: z.number().int().min(0).max(4),
  quantity, unit: text, warehouse: text, shelf: text, reference: text, product: text, productBatchNumber: text,
  occurredAt: text, actor: text, evidence: text, arNumber: text, manufacturingDate: text, expiryDate: text, effectiveExpiryDate: text });
const ledger = z.object({ id: z.string(), materialBatchId: z.string(), materialBatchNumber: text, occurredAt: z.string(),
  description: text, reference: text, arNumber: text, warehouse: text, product: text, productBatchNumber: text, unit: text,
  received: quantity, issued: quantity, balance: quantity });
/** All totals are required: a missing or unreadable balance must never become an apparent zero. */
export const stockTraceSchema = z.object({ materialId: z.string(), materialCode: text, materialName: z.string(), materialKind: z.union([z.literal(0), z.literal(1)]), category: text, pharmacopoeia: text, departmentId: z.string(), departmentName: text,
  unit: text, periodStart: z.string(), generatedAt: z.string(), openingBalance: quantity, received: quantity, issued: quantity, ledgerClosing: quantity,
  storeStock: quantity, reservedStock: quantity, freeStock: quantity, expiredStock: quantity, unavailableStock: quantity,
  productionFloorStock: quantity, consumedStock: quantity, inTransitStock: quantity, ledgerGap: quantity, gaps: z.array(z.string()), rows: z.array(row), ledgerRows: z.array(ledger) });
export type StockTrace = z.infer<typeof stockTraceSchema>;
export type StockTraceRow = z.infer<typeof row>;
export type StockTraceLedgerRow = z.infer<typeof ledger>;
