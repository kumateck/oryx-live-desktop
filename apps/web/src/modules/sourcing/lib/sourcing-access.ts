export const sourcingListPath = "/procurement/requisition";
export const sourcingPath = (id: string) => `${sourcingListPath}/${id}`;
/** Choosing the suppliers a requisition's materials are quoted by. Viewing the requisition does not include it. */
export const sourcePermission = "CanSourcePurchaseRequisition";
export const audit = { module: "Procurement", subModule: "Purchase Requisition" } as const;
