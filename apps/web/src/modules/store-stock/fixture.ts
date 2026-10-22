import { itemSchema } from "@/shared/inventory/contracts";
import { receiptSchema } from "./schemas/stock";
export const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
export const unitId = "79e15fc7-4f91-45e3-abbb-330d35956510";
export const receiptId = "02157256-a433-4895-a50d-ea5d67beb3b9";
export const creator = "4ba45f2d-fd9a-4c61-86bc-ac290d102fdc";
export const item = itemSchema.parse({
  id,
  name: "Gloves",
  code: "GLV",
  store: 0,
  classification: 0,
  unitOfMeasure: { id: unitId, name: "Pieces", symbol: "pcs" },
  minimumLevel: 0,
  maximumLevel: 0,
  reorderLevel: 0,
  availableQuantity: 10,
  isActive: true,
  description: "",
  attachments: [],
});
export const receipt = receiptSchema.parse({
  id: receiptId,
  itemId: id,
  item,
  quantity: 5,
  status: 0,
  memoId: unitId,
  memo: { id: unitId, code: "MEM01", paid: true },
  createdAt: "2026-10-01T10:00:00Z",
  createdBy: { id: creator, firstName: "Creator" },
});
export const transaction = {
  id: unitId,
  itemCode: "GLV",
  date: "2026-10-01T11:00:00Z",
  createdAt: "2026-10-01T11:00:00Z",
  transactionType: "Purchased",
  credit: 10,
  debit: 0,
  totalBalance: 10,
  shadowHold: 0,
};
