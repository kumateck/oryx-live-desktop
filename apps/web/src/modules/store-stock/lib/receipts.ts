import { readAllPages } from "@/shared/api/read-all-pages";
import { type ReceiptPage, type StockReceipt, ReceiptStatus } from "../schemas/stock";
export const readReceipts = (load: (page: number) => Promise<ReceiptPage>, signal = new AbortController().signal) =>
  readAllPages(
    async (page) => {
      if (page > 200) throw new Error("Receipt validation supports at most 20,000 records per status.");
      return load(page);
    },
    (r) => r.id,
    signal,
  );
export function receiptProblem(original: StockReceipt, current: StockReceipt | undefined, actor: string): string | null {
  if (!current || JSON.stringify(current) !== JSON.stringify(original)) return "This receipt changed. Reopen the current receiving register.";
  if (current.status !== ReceiptStatus.Pending || !current.item.isActive || current.quantity <= 0 || !Number.isInteger(current.quantity))
    return "Only pending, positive whole-number receipts for active items can be decided.";
  if (!current.createdBy?.id) return "The receipt creator could not be verified. Review its audit identity before a decision.";
  if (current.createdBy.id === actor) return "Another authorized user must decide a receipt you created.";
  return null;
}
