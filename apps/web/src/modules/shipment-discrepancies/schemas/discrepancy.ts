import { z } from "zod";
const named = z.object({ id: z.string().min(1), name: z.string().nullish() });
const unit = z.object({ id: z.string().min(1), symbol: z.string().nullish() });
export const shipmentDiscrepancySchema = z.object({
  id: z.string().min(1), createdAt: z.string(), approved: z.boolean(), rejected: z.boolean(),
  shipmentDocument: z.object({ id: z.string().min(1), code: z.string().nullish() }),
  items: z.array(z.object({ id: z.string().min(1), material: named, uoM: unit, shipmentInvoiceItemId: z.string().nullish(),
    declaredQuantitySnapshot: z.number().finite(), receivedQuantity: z.number().finite().nonnegative(), reason: z.string().nullish(), resolved: z.boolean().optional(),
  })).min(1),
});
export type ShipmentDiscrepancy = z.infer<typeof shipmentDiscrepancySchema>;
export const shortageSchema = z.object({ shipmentDiscrepancyId: z.string().min(1), shipmentDiscrepancyItemId: z.string().min(1),
  declaredQuantity: z.number().finite().nonnegative(), initialPhysicalQuantity: z.number().finite().nonnegative(), confirmedMakeUpQuantity: z.number().finite().nonnegative(),
  inFlightMakeUpQuantity: z.number().finite().nonnegative(), outstandingQuantity: z.number().finite().nonnegative(), availableToShipQuantity: z.number().finite().nonnegative(),
});
export type ShortageBalance = z.infer<typeof shortageSchema>;
export const discrepancyDocumentSchema = z.object({ id: z.string().min(1), code: z.string(), shipmentInvoice: z.object({
  id: z.string().min(1), items: z.array(z.object({ id: z.string().min(1), material: named, uoM: unit, expectedQuantity: z.number().finite().nonnegative() })).min(1),
}) });
export type DiscrepancyDocument = z.infer<typeof discrepancyDocumentSchema>;
export const shipmentDiscrepancyAudit = { module: "Logistics", subModule: "Shipment Discrepancies" };
export const shipmentDiscrepancyPath = (id: string) => `/logistics/shipment-discrepancies/${encodeURIComponent(id)}`;
export const shipmentDiscrepancyStatus = (row: ShipmentDiscrepancy) => row.rejected ? "Rejected" : row.approved ? "Approved" : "Pending approval";
