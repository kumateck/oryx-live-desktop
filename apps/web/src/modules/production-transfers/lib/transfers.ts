import { z } from "zod";

export enum TransferStatus { Pending = 0, Approved = 1, Issued = 2, Rejected = 3 }
import { TransferDirection } from "./status";
export { TransferDirection } from "./status";
export { transfersPath, transferPath, transferPermissions, transferAudit, directionPermission } from "./access";
const department = z.object({ id: z.string().nullish(), name: z.string().nullish() }).nullish();
export const transferSchema = z.object({
  id: z.string().min(1), createdAt: z.string().nullish(), quantity: z.number().finite().nullish(), status: z.number().int().nullish(),
  material: z.object({ id: z.string().nullish(), name: z.string().nullish(), code: z.string().nullish() }).nullish(),
  uoM: z.object({ id: z.string().nullish(), symbol: z.string().nullish() }).nullish(), fromDepartment: department, toDepartment: department,
  reason: z.string().nullish(), approvedAt: z.string().nullish(), issuedAt: z.string().nullish(),
});
export type Transfer = z.infer<typeof transferSchema>;
export const transferRowsSchema = z.array(transferSchema);
export const statusLabel = (status: number | null | undefined) => status === TransferStatus.Pending ? "Awaiting approval" : status === TransferStatus.Approved ? "Approved" : status === TransferStatus.Issued ? "Issued" : status === TransferStatus.Rejected ? "Rejected" : status == null ? "Not recorded" : `Unknown (${status})`;
export const belongsToDepartment = (transfer: Transfer, departmentId: string | null, direction: TransferDirection) => Boolean(departmentId && (direction === TransferDirection.Incoming ? transfer.fromDepartment?.id : transfer.toDepartment?.id) === departmentId);
export function decisionProblem(transfer: Transfer, departmentId: string | null): string | null {
  if (!belongsToDepartment(transfer, departmentId, TransferDirection.Incoming)) return "Only the supplying department can decide this request.";
  if (transfer.status !== TransferStatus.Pending) return "This transfer is no longer awaiting approval. Refresh the record.";
  if (!transfer.material?.id || !transfer.toDepartment?.id || !transfer.quantity || transfer.quantity <= 0 || !transfer.uoM?.id) return "The material, unit, destination or quantity is missing. This request cannot be decided.";
  return null;
}
/** Prevent confirmation of materially different evidence after the reviewer opens the dialog. */
export function sameDecisionEvidence(before: Transfer, after: Transfer): boolean {
  return before.id === after.id && before.quantity === after.quantity && before.material?.id === after.material?.id && before.uoM?.id === after.uoM?.id && before.fromDepartment?.id === after.fromDepartment?.id && before.toDepartment?.id === after.toDepartment?.id && before.reason === after.reason;
}
