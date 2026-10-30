import { z } from "zod";
import { countText, fgCount, fgLayout, yieldOf } from "@/shared/packing/fg-quantity";
import { api } from "@/shared/api/base-api";
import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

export const notesPath = "/warehouse/finished-goods-transfer-notes";
export const notePath = (id: string) => `${notesPath}/${id}`;
export const audit = { module: "Warehouse", subModule: "Finished Goods Transfer Notes" } as const;
export const notePermissions = { view: "CanViewFgtn", approve: "CanApproveFgtn" } as const;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const note = z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), createdBy: z.object({ firstName: text, lastName: text }).nullish(), transferNoteNumber: text, fromWarehouse: z.object({ name: text }).nullish(), toWarehouse: z.object({ name: text }).nullish(),
  quantityPerPack: amount, productPacking: z.object({ id: z.string().nullish(), name: text, packPerShipper: z.number().nullish(),
    basePackingUoM: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(),
    packingLists: z.array(z.object({ uom: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(), quantity: z.number().nullish(), order: z.number().nullish() })).nullish() }).nullish(), uoM: z.object({ symbol: text }).nullish(), totalQuantity: amount, quantityReceived: amount, notes: text, qarNumber: text,
  isApproved: z.boolean().nullish(), loose: amount, allocatedQuantity: amount, remainingQuantity: amount, pendingAllocatedQuantity: amount,
  batchManufacturingRecord: z.object({ id: z.string().nullish(), batchNumber: text, manufacturingDate: date, expiryDate: date,
    productionScheduleProduct: z.object({ product: z.object({ id: z.string().nullish(), name: text, code: text, genericName: text, category: z.object({ name: text }).nullish() }).nullish() }).nullish() }).nullish() });

function read(entry: z.infer<typeof note>) {
  if (!entry.id) return null;
  const product = entry.batchManufacturingRecord?.productionScheduleProduct?.product;
  // Every quantity on a note is yield (base units produced). The packing style turns it into shippers and loose packs.
  // The units in one pack saved on the note win over the packing style, as on the server, so a later edit to the
  // style cannot change what this stock means. Older notes without one fall back to the style.
  const styled = fgLayout(entry.productPacking);
  const layout = { ...styled, baseUnitsPerPack: entry.quantityPerPack > 0 ? entry.quantityPerPack : styled.baseUnitsPerPack };
  return { id: entry.id, number: entry.transferNoteNumber, createdAt: entry.createdAt ?? null, createdBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null, from: entry.fromWarehouse?.name ?? null, to: entry.toWarehouse?.name ?? null,
    productId: product?.id ?? null, productName: product?.name ?? "Unnamed product", productCode: product?.code ?? null, genericName: product?.genericName ?? null, category: product?.category?.name ?? null,
    batchNumber: entry.batchManufacturingRecord?.batchNumber ?? null, made: entry.batchManufacturingRecord?.manufacturingDate ?? null, expires: entry.batchManufacturingRecord?.expiryDate ?? null,
    packing: entry.productPacking?.name ?? null, perShipper: layout.perShipper ?? 0, layout, unit: entry.uoM?.symbol ?? null, total: entry.totalQuantity, received: entry.quantityReceived,
    loose: entry.loose, allocated: entry.allocatedQuantity, remaining: entry.remainingQuantity, pending: entry.pendingAllocatedQuantity, notes: entry.notes, qar: entry.qarNumber, approved: entry.isApproved === true };
}
/** Packed product sent from production to the finished goods store: what was sent, what the store received, and what is left. */
export const noteSchema = note.transform(read);
export const noteRowsSchema = z.array(note).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type TransferNote = z.infer<typeof noteRowsSchema>[number];

// An empty number field reports "not a number"; it counts as none.
const count = (message: string) => z.number().or(z.nan()).refine((value) => Number.isNaN(value) || (Number.isInteger(value) && value >= 0), message);
/** The store enters shippers and loose packs. They are checked as yield: never nothing, never more than was sent. */
export const approveSchema = (noteLike: Pick<TransferNote, "total" | "layout">) => z.object({ shippers: count("Enter a whole number of shippers, 0 or more"), loose: count("Enter a whole number of loose packs, 0 or more"), notes: z.string() })
  .superRefine((value, context) => {
    const received = yieldOf(value.shippers, value.loose, noteLike.layout);
    if (received === null) context.addIssue({ code: "custom", path: ["shippers"], message: "The packing style does not say how many units fill a pack, so shippers cannot be counted" });
    else if (received <= 0) context.addIssue({ code: "custom", path: ["shippers"], message: "Enter what was received" });
    else if (received > noteLike.total) { const sent = fgCount(noteLike.total, noteLike.layout);
      context.addIssue({ code: "custom", path: ["shippers"], message: `That is more than was sent (${sent ? countText(sent, noteLike.layout.baseName) : "–"})` }); }
  });
export interface ApproveValues { shippers: number; loose: number; notes: string }

const list = { type: "FinishedGoods" as const, id: "all" };
export const noteApi = productionApi.enhanceEndpoints({ endpoints: { getApiV1ProductionScheduleFinishedGoodsTransferNote: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1ProductionScheduleFinishedGoodsTransferNoteById: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1ProductionScheduleApprovedProducts: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1ProductionScheduleApprovedProductsByProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); } } });
export const { useGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery, useGetApiV1ProductionScheduleApprovedProductsQuery, useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery } = noteApi;
/** The server's approve action has no typed response in its contract, so it is declared here. */
export const { useApproveTransferNoteMutation } = api.injectEndpoints({ endpoints: (build) => ({ approveTransferNote: build.mutation<void, { id: string; quantityReceived: number; notes: string | null }>({
  query: ({ id, quantityReceived, notes }) => ({ url: `/api/v1/production-schedule/finished-goods-transfer-note/${id}/approve`, method: "PUT", body: { quantityReceived, notes }, headers: { Module: audit.module, SubModule: audit.subModule } }),
  invalidatesTags: (_result, error) => error ? [] : [list, { type: "PendingApprovals", id: "all" }] }) }) });
