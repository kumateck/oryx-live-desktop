import { z } from "zod";
import { expiredOrDue } from "@/modules/stock-issue/lib/stock-issue";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const transfersPath = "/warehouse/stock-transfer-requests";
export const transferPath = (id: string) => `${transfersPath}/${id}/details`;
export const allocationPath = `${transfersPath}/allocation`;
export const audit = { module: "Warehouse", subModule: "Stock Transfer Issues" } as const;
export const viewPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialTransferList", 1: "CanViewPackagingMaterialTransferList" };
export const issuePermissions: Record<MaterialKind, string> = { 0: "CanIssueRawMaterialStockTransfers", 1: "CanIssuePackagingMaterialStockTransfers" };

/** Where a transfer stands. The numbers are the server's. */
export const transferStatus = { inProgress: 0, approved: 1, issued: 2, rejected: 3 } as const;
export const transferStatusLabels: Record<number, string> = { 0: "Awaiting approval", 1: "Ready to issue", 2: "Issued", 3: "Rejected" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);

const transfer = z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), approvedAt: date, issuedAt: date, status: z.number().nullish(), quantity: amount, reason: text, uoM: z.object({ symbol: text }).nullish(),
  material: z.object({ name: text, code: text, kind: z.number().nullish() }).nullish(), fromDepartment: z.object({ name: text }).nullish(), toDepartment: z.object({ name: text }).nullish() });
function read(entry: z.infer<typeof transfer>) {
  if (!entry.id) return null;
  return { id: entry.id, createdAt: entry.createdAt ?? null, approvedAt: entry.approvedAt, issuedAt: entry.issuedAt, status: entry.status ?? 0, quantity: entry.quantity, reason: entry.reason, unit: entry.uoM?.symbol ?? null,
    materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null, kind: (entry.material?.kind === 1 ? 1 : 0) as MaterialKind, from: entry.fromDepartment?.name ?? null, to: entry.toDepartment?.name ?? null };
}
/** One department's share of a stock transfer: a quantity of a material moving from one department's store to another's. */
export const transferSchema = transfer.transform(read);
export const transferRowsSchema = z.array(transfer).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Transfer = z.infer<typeof transferRowsSchema>[number];

/** The batches the server has picked to meet a transfer. */
export const transferBatchesSchema = z.array(z.object({ quantityToTake: amount, batch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, isReturn: z.boolean().nullish() }).nullish() })).nullish()
  .transform((value) => (value ?? []).map((item, index) => ({ key: `${item.batch?.id ?? "batch"}-${index}`, id: item.batch?.id ?? null, number: item.batch?.batchNumber ?? null, quantity: item.quantityToTake, expires: item.batch?.expiryDate ?? null, returned: item.batch?.isReturn === true })));
export type TransferBatch = z.infer<typeof transferBatchesSchema>[number];

/**
 * Why a transfer cannot be issued, or null when it can. The server checks only that the batches hold enough,
 * so that it is approved, not already issued, and not from expired stock is checked here.
 */
export function transferIssueBlock(transfer: Pick<Transfer, "status" | "quantity">, batches: readonly TransferBatch[], today: Date = new Date()): string | null {
  if (transfer.status === transferStatus.issued) return "This transfer has already been issued.";
  if (transfer.status === transferStatus.rejected) return "This transfer was rejected.";
  if (transfer.status !== transferStatus.approved) return "This transfer is waiting for approval.";
  if (batches.length === 0 || batches.some((batch) => !batch.id)) return "Your store has no stock picked for this transfer.";
  if (batches.some((batch) => expiredOrDue(batch.expires, today))) return "A batch picked for this transfer has expired or expires today.";
  const picked = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (transfer.quantity - picked > 1e-6) return "The stock picked does not cover the quantity asked for.";
  return null;
}

const holding = z.object({ id: z.string().nullish(), status: z.number().nullish(), batches: z.array(z.object({ quantity: amount, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), sourceWarehouse: z.object({ name: text }).nullish(),
  materialBatch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), material: z.object({ name: text, code: text }).nullish() }).nullish() })).nullish() });
/** Stock that has been issued to this department by transfer and is waiting to be put on shelves, one row per batch. */
export const holdingRowsSchema = z.array(holding).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? (entry.batches ?? []).flatMap((batch, index) => { const unit = batch.uoM?.id ? batch.uoM : batch.materialBatch?.uoM ?? batch.uoM;
  return batch.materialBatch?.id ? [{ key: `${entry.id}:${batch.materialBatch.id}:${index}`, holdingId: entry.id as string, batchId: batch.materialBatch.id, batchNumber: batch.materialBatch.batchNumber ?? null, expires: batch.materialBatch.expiryDate ?? null,
    materialName: batch.materialBatch.material?.name ?? "Unnamed material", materialCode: batch.materialBatch.material?.code ?? null, quantity: batch.quantity, unit: unit?.symbol ?? null, unitId: unit?.id ?? null, from: batch.sourceWarehouse?.name ?? null }] : []; }) : []));
export type HeldStock = z.infer<typeof holdingRowsSchema>[number];
