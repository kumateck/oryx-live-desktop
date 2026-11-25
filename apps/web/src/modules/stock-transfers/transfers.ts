import { z } from "zod";
import { stockShelfSchema, stockShelfLocation } from "@/shared/warehouse/stock-location";
import { expiredOrDue } from "@/modules/stock-issue/lib/stock-issue";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const transfersPath = "/warehouse/stock-transfer-requests";
export const transferPath = (id: string) => `${transfersPath}/${id}/details`;
export const allocationPath = `${transfersPath}/allocation`;
export const audit = { module: "Warehouse", subModule: "Stock Transfer Issues" } as const;
export const viewPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialTransferList", 1: "CanViewPackagingMaterialTransferList" };
export const issuePermissions: Record<MaterialKind, string> = { 0: "CanIssueRawMaterialStockTransfers", 1: "CanIssuePackagingMaterialStockTransfers" };
export const assignPermissions: Record<MaterialKind, string> = { 0: "CanAssignRawMaterialStockTransfers", 1: "CanAssignPackagingMaterialStockTransfers" };
/** Refusing a transfer the store cannot supply; the server also requires the supplying department. */
export const rejectPermission = "CanRejectIncomingStockTransferRequest";

/** Where a transfer stands. The numbers are the server's. */
export const transferStatus = { inProgress: 0, approved: 1, issued: 2, rejected: 3 } as const;
export const transferStatusLabels: Record<number, string> = { 0: "Awaiting approval", 1: "Ready to issue", 2: "Issued", 3: "Rejected" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);

const transfer = z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), approvedAt: date, issuedAt: date, status: z.number().nullish(), quantity: amount, reason: text, uoM: z.object({ symbol: text }).nullish(),
  // The same quantity in the supplying store's own unit (server-converted with the material's density). Optional for older servers.
  supplierQuantity: z.number().nullish(), supplierUoM: z.object({ symbol: text }).nullish(),
  // Why the supplying store refused it (optional: older servers leave these out).
  rejectionReason: text, rejectedAt: date, rejectedBy: z.object({ name: text }).nullish(),
  material: z.object({ name: text, code: text, kind: z.number().nullish() }).nullish(), fromDepartment: z.object({ name: text }).nullish(), toDepartment: z.object({ name: text }).nullish() });
function read(entry: z.infer<typeof transfer>) {
  if (!entry.id) return null;
  return { id: entry.id, createdAt: entry.createdAt ?? null, approvedAt: entry.approvedAt, issuedAt: entry.issuedAt, status: entry.issuedAt ? transferStatus.issued : entry.status ?? transferStatus.inProgress, quantity: entry.quantity, reason: entry.reason, unit: entry.uoM?.symbol ?? null,
    rejection: entry.rejectionReason || entry.rejectedAt ? { reason: entry.rejectionReason, at: entry.rejectedAt, by: entry.rejectedBy?.name ?? null } : null,
    supply: typeof entry.supplierQuantity === "number" && Number.isFinite(entry.supplierQuantity) && entry.supplierUoM?.symbol ? { quantity: entry.supplierQuantity, unit: entry.supplierUoM.symbol } : null,
    materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null, kind: (entry.material?.kind === 1 ? 1 : 0) as MaterialKind, from: entry.fromDepartment?.name ?? null, to: entry.toDepartment?.name ?? null };
}
/** One department's share of a stock transfer: a quantity of a material moving from one department's store to another's. */
export const transferSchema = transfer.transform(read);
export const transferRowsSchema = z.array(transfer).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Transfer = z.infer<typeof transferRowsSchema>[number];

/** Proposed batches before issue, recorded batches after issue. */
export const transferBatchesSchema = z.array(z.object({ warehouseLocationShelf: stockShelfSchema, sourceQuantityToTake: z.number().nullish(), quantityToTake: amount, batch: z.object({ uoM: z.object({ symbol: text }).nullish(), id: z.string().nullish(), batchNumber: text, expiryDate: date, effectiveExpiryDate: date, expired: z.boolean().nullish(), isReturn: z.boolean().nullish() }).nullish() })).nullish()
  .transform((value) => (value ?? []).map((item, index) => ({ key: `${item.batch?.id ?? "batch"}-${index}`, id: item.batch?.id ?? null, number: item.batch?.batchNumber ?? null, quantity: item.quantityToTake, sourceQuantity: item.sourceQuantityToTake ?? null, sourceUnit: item.batch?.uoM?.symbol ?? null, expires: item.batch?.effectiveExpiryDate ?? item.batch?.expiryDate ?? null, ...(typeof item.batch?.expired === "boolean" ? { expired: item.batch.expired } : {}), returned: item.batch?.isReturn === true, location: stockShelfLocation(item.warehouseLocationShelf) })));
export type TransferBatch = z.infer<typeof transferBatchesSchema>[number];

/**
 * Local feedback for the server's proposed batches. The server rechecks eligibility and stock at issue.
 */
export function transferIssueBlock(transfer: Pick<Transfer, "status" | "quantity">, batches: readonly (Pick<TransferBatch, "id" | "quantity" | "expires"> & { expired?: boolean })[], today: Date = new Date()): string | null {
  if (transfer.status === transferStatus.issued) return "This transfer has already been issued.";
  if (transfer.status === transferStatus.rejected) return "This transfer was rejected.";
  if (transfer.status !== transferStatus.approved) return "This transfer is waiting for approval.";
  if (batches.length === 0 || batches.some((batch) => !batch.id)) return "Your store has no stock picked for this transfer.";
  if (batches.some((batch) => batch.expired ?? expiredOrDue(batch.expires, today))) return "A batch picked for this transfer has expired or expires today.";
  const picked = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  if (transfer.quantity - picked > 1e-6) return "The stock picked does not cover the quantity asked for.";
  return null;
}

/** What the supplying store sees: the quantity in its own unit when the server converted it, with the requester's figure kept beside it. */
export function supplyQuantity(transfer: Pick<Transfer, "quantity" | "unit" | "supply">): { quantity: number; unit: string | null; asked: { quantity: number; unit: string | null } | null } {
  const converted = transfer.supply && transfer.supply.unit.toLowerCase() !== transfer.unit?.toLowerCase();
  return converted && transfer.supply ? { quantity: transfer.supply.quantity, unit: transfer.supply.unit, asked: { quantity: transfer.quantity, unit: transfer.unit } } : { quantity: transfer.quantity, unit: transfer.unit, asked: null };
}

/**
 * The picked batches in the supplying store's unit when every batch reports its physical quantity in that unit;
 * otherwise null and the batches stay in the request unit.
 */
export function batchesInSupplyUnit<T extends Pick<TransferBatch, "quantity" | "sourceQuantity" | "sourceUnit">>(batches: readonly T[], unit: string | null): T[] | null {
  if (!unit || batches.length === 0 || batches.some((batch) => batch.sourceQuantity === null || batch.sourceUnit?.toLowerCase() !== unit.toLowerCase())) return null;
  return batches.map((batch) => ({ ...batch, quantity: batch.sourceQuantity ?? batch.quantity }));
}

/** Whether the store may still refuse the transfer: not issued and not already decided against. */
export const refusable = (transfer: Pick<Transfer, "status" | "issuedAt">) =>
  !transfer.issuedAt && (transfer.status === transferStatus.inProgress || transfer.status === transferStatus.approved);

/**
 * Why the transfer cannot be issued now, said plainly, with what the store can do about it. `problem` is the local
 * block or the server's answer about the picked stock; the server's shortfall already names what is free and needed.
 */
export function issueEligibility(transfer: Pick<Transfer, "status">, problem: string, fromServer: boolean, mayReject: boolean): { title: string; reason: string; next: string } {
  const orReject = mayReject ? ", or reject it with the reason it cannot be supplied" : "";
  if (transfer.status === transferStatus.inProgress)
    return { title: "Not approved yet", reason: problem, next: `It must be approved before stock can be issued${orReject}.` };
  const short = /short by|does not cover|no stock picked/i.test(problem);
  return {
    title: short ? "Not enough stock to issue this transfer" : "This transfer cannot be issued yet",
    reason: problem,
    next: short ? `Wait until the stock is received and approved${mayReject ? ", or reject it with the reason so the requesting department can ask elsewhere" : ""}.`
      : `${fromServer ? "Resolve the problem above" : "Refresh after the problem above is resolved"}${orReject}.`,
  };
}

const holding = z.object({ id: z.string().nullish(), status: z.number().nullish(), batches: z.array(z.object({ receivedAt: text, destinationQuantity: z.number().nullish(), destinationUoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), quantity: amount, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), sourceWarehouse: z.object({ name: text }).nullish(),
  materialBatch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, effectiveExpiryDate: date, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), material: z.object({ name: text, code: text }).nullish() }).nullish() })).nullish() });
/** Stock that has been issued to this department by transfer and is waiting to be put on shelves, one row per batch. */
export const holdingRowsSchema = z.array(holding).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? (entry.batches ?? []).filter(batch => !batch.receivedAt).flatMap((batch, index) => { const unit = batch.destinationUoM?.id ? batch.destinationUoM : batch.uoM?.id ? batch.uoM : batch.materialBatch?.uoM ?? batch.uoM;
  return batch.materialBatch?.id ? [{ key: `${entry.id}:${batch.materialBatch.id}:${index}`, holdingId: entry.id as string, batchId: batch.materialBatch.id, batchNumber: batch.materialBatch.batchNumber ?? null, expires: batch.materialBatch.effectiveExpiryDate ?? batch.materialBatch.expiryDate ?? null,
    materialName: batch.materialBatch.material?.name ?? "Unnamed material", materialCode: batch.materialBatch.material?.code ?? null, quantity: batch.destinationQuantity ?? batch.quantity, unit: unit?.symbol ?? null, unitId: unit?.id ?? null, from: batch.sourceWarehouse?.name ?? null }] : []; }) : []));
export type HeldStock = z.infer<typeof holdingRowsSchema>[number];
