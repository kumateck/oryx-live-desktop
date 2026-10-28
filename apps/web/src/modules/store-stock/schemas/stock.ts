import { z } from "zod";
import { Store } from "@/shared/inventory/stores";
export enum ReceiptStatus {
  Pending,
  Approved,
  Rejected,
}
export const stockItem = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string(),
  store: z.enum(Store),
  classification: z.union([z.literal(0), z.literal(1)]),
  isActive: z.boolean(),
  availableQuantity: z.number().int(),
  minimumLevel: z.number().int().nonnegative(),
  maximumLevel: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  unitOfMeasure: z.object({ id: z.uuid(), name: z.string(), symbol: z.string().nullish() }).nullish(),
});
export const receiptSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  item: stockItem,
  quantity: z.number().finite(),
  status: z.enum(ReceiptStatus),
  memoId: z.uuid(),
  memo: z.object({ id: z.uuid(), code: z.string().nullish(), paid: z.boolean().optional() }).nullish(),
  createdAt: z.string(),
  createdBy: z.object({ id: z.uuid(), firstName: z.string().nullish(), lastName: z.string().nullish() }).nullish(),
});
export type StockReceipt = z.infer<typeof receiptSchema>;
export const receiptPage = z.object({
  data: z.array(receiptSchema),
  pageIndex: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
  totalRecordCount: z.number().int().nonnegative(),
});
export type ReceiptPage = z.infer<typeof receiptPage>;
export const stockAudit = { module: "General Stores", subModule: "Stock receipts and availability" };
export const ledgerRows = z.array(
  z.object({
    id: z.uuid(),
    itemCode: z.string(),
    date: z.string(),
    createdAt: z.string(),
    transactionType: z.enum(["Damaged", "Missing", "Returned", "Issued", "Purchased", "Adjustment"]),
    credit: z.number().nonnegative(),
    debit: z.number().nonnegative(),
    totalBalance: z.number(),
    shadowHold: z.number().nullish(),
  }),
);
export type LedgerRow = z.infer<typeof ledgerRows>[number];

export enum DamageKind {
  Damaged,
  Missing,
}
