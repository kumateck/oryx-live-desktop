import { utcBoundary } from "@/shared/format/date-boundary";
import type { ChecklistRequest } from "../api/receiving-api";
import type { ChecklistFormValues, DeliveredMaterial } from "../schemas/receiving-schema";
import { toStored } from "./receiving";

/** A batch is made from the first day of its month, and can be used until the last day of the month it expires in. */
export const monthStart = (month: string) => `${month}-01T00:00:00.000Z`;
export const monthEnd = (month: string) => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString();

/** The checklist as the server takes it: quantities in the material's stored unit, dates as calendar days. */
export function checklistRequest(material: DeliveredMaterial & { materialId: string }, values: ChecklistFormValues): ChecklistRequest | null {
  const { checkedAt, intactness, carrier } = values;
  if (!checkedAt || !intactness || !carrier) return null;
  const batches = values.batches.flatMap((batch) => {
    if (!batch.made || !batch.style) return [];
    const perContainer = toStored(batch.perContainer, material.unit);
    return [{ materialId: material.materialId, batchNumber: batch.number || null, numberOfContainers: batch.containers, containerPackageStyleId: batch.style.value, quantityPerContainer: perContainer,
      totalQuantity: toStored(batch.containers * batch.perContainer, material.unit), uoMId: material.unitId, dateReceived: utcBoundary(checkedAt), manufacturingDate: monthStart(batch.made),
      ...(batch.expires ? { expiryDate: monthEnd(batch.expires) } : {}),
      sampleWeights: batch.weights.flatMap((weight) => typeof weight.gross === "number" && Number.isFinite(weight.gross) ? [weight.gross] : []).map((gross, index) => ({ srNumber: String(index + 1), grossWeight: gross })) }];
  });
  if (batches.length !== values.batches.length) return null;
  return { distributedRequisitionMaterialId: material.id, materialId: material.materialId, checkedAt: utcBoundary(checkedAt), shipmentInvoiceId: material.invoiceId, supplierId: material.supplierId, manufacturerId: material.manufacturerId,
    certificateOfAnalysisDelivered: values.certificate === "yes", visibleLabelling: values.labelled === "yes", intactnessStatus: Number(intactness.value), consignmentCarrierStatus: Number(carrier.value), materialBatches: batches };
}
