export type MaterialRepairKind = "bom" | "packaging";

export const materialRepairs = {
  bom: { label: "BOM", permission: "CanRepairBom", description: "Reconcile raw-material requirements, reservations and the unissued requisition with the product’s saved BOM." },
  packaging: { label: "Packaging", permission: "CanRepairPackaging", description: "Reconcile packaging requirements, reservations and the unissued requisition for this batch’s packing style." },
} as const;
