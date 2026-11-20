import { z } from "zod";
import { formatMonthYear } from "@/shared/date-pickers/date-utils";
import type { DomainEntitiesApprovedVendorListsSaveApprovedVendorListLineRequest as LineRequest } from "@/shared/api/generated/procurement";

export const ListStatus = { Pending: 0, Approved: 1, Superseded: 2, Rejected: 3 } as const;
const statusNames = ["Being prepared", "Current", "Superseded", "Rejected"];
export const listStatusLabel = (status: number) => statusNames[status] ?? `Unknown (${String(status)})`;
export const ReviewStatus = { AwaitingReview: 0, Returned: 1, Confirmed: 2 } as const;
/** Where a list being prepared stands: in review, returned, or (review confirmed) awaiting approval. */
export const stageLabel = (status: number, review: number | null) => status !== ListStatus.Pending ? listStatusLabel(status)
  : review === ReviewStatus.AwaitingReview ? "Awaiting check" : review === ReviewStatus.Returned ? "Returned for correction" : "Awaiting approval";

const text = z.string().nullish().transform((value) => value?.trim() || null);
/** A stored month (first day, as a date-time) as `YYYY-MM`. */
const month = z.string().regex(/^\d{4}-\d{2}/).transform((value) => value.slice(0, 7));

export const summarySchema = z.object({
  id: z.string(), annexureNumber: text, revisionNumber: z.number(), supersedesRevision: z.number().nullish().transform((v) => v ?? null),
  status: z.number(), reviewStatus: z.number().nullish().transform((v) => v ?? null), lineCount: z.number().catch(0),
  createdAt: text, approvedAt: text, preparedBy: text,
});
export type ListSummary = z.infer<typeof summarySchema>;
export const summariesSchema = z.array(summarySchema);

const signatory = z.object({ name: text, designation: text, signature: text, signedAt: text }).nullish().transform((s) => s?.name ? s : null);
export type Signatory = NonNullable<z.infer<typeof signatory>>;
export const lineSchema = z.object({
  id: z.string(), order: z.number().catch(0), materialId: z.string(), materialCode: text, materialName: text,
  manufacturerId: z.string(), manufacturerName: text, manufacturerAddress: text, supplierId: z.string(), supplierName: text,
  quantityPerPack: z.number(), approvalDate: month, validityDate: month, lapsed: z.boolean().catch(false),
});
export type ListLine = z.infer<typeof lineSchema>;
export const detailSchema = summarySchema.extend({
  previousRevisionId: text, supersededAt: text, reviewVersion: z.number().nullish().transform((v) => v ?? null),
  lines: z.array(lineSchema).nullish().transform((lines) => lines ?? []),
  preparedBySignatory: signatory, checkedBy: signatory, approvedBy: signatory,
});
export type ListDetail = z.infer<typeof detailSchema>;

/** A line being edited. A manufacturer or supplier is either chosen (an id) or entered as new. */
export interface DraftLine {
  key: string;
  materialId: string; materialLabel: string;
  manufacturer: { id: string; name: string; address: string | null } | { id: null; name: string; address: string | null };
  supplier: { id: string; name: string } | { id: null; name: string; address: string | null; type: 0 | 1 };
  quantityPerPack: string; approvalMonth: string; validityMonth: string;
}

export const materialLabel = (code: string | null, name: string | null) => code ? `${code} · ${name ?? "Unnamed"}` : name ?? "Unnamed";

export function draftFromLine(line: ListLine): DraftLine {
  return {
    key: line.id, materialId: line.materialId, materialLabel: materialLabel(line.materialCode, line.materialName),
    manufacturer: { id: line.manufacturerId, name: line.manufacturerName ?? "Unnamed", address: line.manufacturerAddress },
    supplier: { id: line.supplierId, name: line.supplierName ?? "Unnamed" },
    quantityPerPack: String(line.quantityPerPack), approvalMonth: line.approvalDate, validityMonth: line.validityDate,
  };
}

/** The request for one line. Months go as their first day. */
export function lineRequest(line: DraftLine): LineRequest {
  const manufacturer = line.manufacturer.id !== null ? { manufacturerId: line.manufacturer.id }
    : { newManufacturer: { name: line.manufacturer.name.trim(), address: line.manufacturer.address?.trim() || null } };
  const supplier = line.supplier.id !== null
    ? { supplierId: line.supplier.id }
    : { newSupplier: { name: line.supplier.name.trim(), address: line.supplier.address?.trim() || null, type: line.supplier.type } };
  return { materialId: line.materialId, ...manufacturer, ...supplier, quantityPerPack: Number(line.quantityPerPack),
    approvalDate: `${line.approvalMonth}-01`, validityDate: `${line.validityMonth}-01` };
}

/** What is wrong with a line before it is sent, or null. The server checks again. */
export function lineProblem(line: DraftLine, others: readonly DraftLine[]): string | null {
  if (!line.materialId) return "Choose a material.";
  if (!line.manufacturer.name.trim()) return "Choose or enter the manufacturer.";
  if (!line.supplier.name.trim()) return "Choose or enter the supplier.";
  const quantity = Number(line.quantityPerPack);
  if (!line.quantityPerPack.trim() || !Number.isFinite(quantity) || quantity <= 0) return "Enter the quantity per pack in kg.";
  if (!line.approvalMonth || !line.validityMonth) return "Choose the approval and validity months.";
  if (line.validityMonth < line.approvalMonth) return "The validity month cannot be before the approval month.";
  const same = (a: DraftLine) => a.key !== line.key && a.materialId === line.materialId
    && a.manufacturer.name.trim().toLowerCase() === line.manufacturer.name.trim().toLowerCase()
    && a.supplier.name.trim().toLowerCase() === line.supplier.name.trim().toLowerCase();
  return others.some(same) ? "This material, manufacturer and supplier are already on the list." : null;
}

export const monthLabel = (value: string) => formatMonthYear(value);
/** As printed on the paper list: "Jun 24". */
export function shortMonth(value: string): string {
  const [year, monthNumber] = value.split("-").map(Number);
  if (!year || !monthNumber) return value;
  return `${new Date(year, monthNumber - 1, 1).toLocaleDateString("en-GB", { month: "short" })} ${String(year).slice(-2)}`;
}
