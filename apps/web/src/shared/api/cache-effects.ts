import { createListenerMiddleware, type UnknownAction } from "@reduxjs/toolkit";
import { api } from "./base-api";
import type { generatedTagTypes } from "./generated/cache-tag-types";

// Every generated endpoint is tagged from its own URL (docs/api-codegen.md, "Cache tags"). Some saves change records under
// another URL, which no URL can tell: deciding an approval changes the document approved; assigning or starting a test
// changes the batch. Those effects are declared here, once, by endpoint name, so the screens showing them refresh.

type Resource = (typeof generatedTagTypes)[number];
interface Tag { type: Resource; id: string }
const list = (type: Resource): Tag => ({ type, id: "LIST" });
const record = (type: Resource, id: string | null): Tag[] => id ? [{ type, id }, list(type)] : [list(type)];

/** Where each approvable document lives. A document not listed here still refreshes when its page is opened again. */
export const approvalDocuments: Readonly<Record<string, readonly Resource[]>> = {
  PurchaseOrder: ["procurement/purchase-order"], BillingSheet: ["procurement/billing-sheet"], ShipmentDocument: ["procurement/shipment-document", "procurement/shipment"],
  ShipmentInvoice: ["procurement/shipment-invoice"], Waybill: ["procurement/waybill"],
  PurchaseRequisition: ["requisition"], TrialRequisition: ["requisition"], StockRequisition: ["requisition"], RawStockRequisition: ["requisition"], PackageStockRequisition: ["requisition"],
  ProductionExtraPacking: ["production-schedule/extra-packing"], FinishedGoodsTransferNote: ["production-schedule/finished-goods-transfer-note"],
  ProductionOrder: ["production-order"], ProformaInvoice: ["production-order/proforma-invoice"], AllocateProductionOrder: ["production-order/allocate"],
  StockAdjustment: ["stock-adjustment"], LeaveRequest: ["leave-request"], OvertimeRequest: ["overtime-request"], StaffRequisition: ["staff-requisition"], JobRequest: ["job-request"],
  CustomerQuotation: ["customer"], RndProject: ["rnd/project"], Response: ["form/response", "material/batch", "qa/analytical-test"],
};

type Args = Readonly<Record<string, string | number | boolean | object | null | undefined>>;
const text = (args: Args, ...path: string[]): string | null => {
  let value: Args[string] = args;
  for (const key of path) value = typeof value === "object" && value !== null && key in value ? (value as Args)[key] : undefined;
  return typeof value === "string" && value ? value : null;
};
// A batch's QC steps show on its goods receipt note and its test requests.
const batchSteps = (batch: string | null): Tag[] => [...record("material/batch", batch), list("warehouse"), list("warehouse/grn"), list("qa/analytical-test")];

const decided = (args: Args): Tag[] => {
  const type = text(args, "modelType");
  return (type ? approvalDocuments[type] ?? [] : []).flatMap((resource) => record(resource, text(args, "modelId")));
};

/** The extra records each save changes, from its arguments. */
export const cacheEffects: Readonly<Record<string, (args: Args) => Tag[]>> = {
  postApiV1ApprovalApproveByModelTypeAndModelId: decided,
  postApiV1ApprovalRejectByModelTypeAndModelId: decided,
  postApiV1FormAssignees: (args) => batchSteps(text(args, "domainEntitiesFormsRequestCreateFormAssigneeRequest", "materialBatchId")),
  postApiV1MaterialSamplings: (args) => batchSteps(text(args, "domainEntitiesMaterialSamplingCreateMaterialSamplingRequest", "materialBatchId")),
  putApiV1MaterialArdStartTestByMaterialBatchId: (args) => batchSteps(text(args, "materialBatchId")),
  postApiV1FormResponses: (args) => batchSteps(text(args, "domainEntitiesFormsRequestCreateResponseRequest", "materialBatchId")),
  // A shipment's status is changed at /shipments; the shipment is read at /shipment-document.
  putApiV1ProcurementShipmentsByShipmentIdStatus: (args) => record("procurement/shipment-document", text(args, "shipmentId")),
  postApiV1ProcurementDistributeMaterial: () => [list("procurement/shipment-document"), list("warehouse"), list("requisition")],
};

const savedType = `${api.reducerPath}/executeMutation/fulfilled`;
function saved(action: UnknownAction): { endpoint: string; args: Args } | null {
  if (action.type !== savedType || typeof action.meta !== "object" || action.meta === null || !("arg" in action.meta)) return null;
  const arg = action.meta.arg;
  if (typeof arg !== "object" || arg === null || !("endpointName" in arg) || typeof arg.endpointName !== "string") return null;
  const args = "originalArgs" in arg && typeof arg.originalArgs === "object" && arg.originalArgs !== null ? arg.originalArgs as Args : {};
  return { endpoint: arg.endpointName, args };
}

/** After a successful save with a declared effect, the records it changed are refreshed wherever they are shown. */
export const cacheEffectsMiddleware = createListenerMiddleware();
cacheEffectsMiddleware.startListening({
  predicate: (action) => { const match = saved(action); return match !== null && match.endpoint in cacheEffects; },
  effect: (action, listener) => {
    const match = saved(action);
    const tags = match ? cacheEffects[match.endpoint]?.(match.args) ?? [] : [];
    if (tags.length) listener.dispatch(api.util.invalidateTags(tags));
  },
});
