import { itemSchema } from "@/shared/inventory/contracts";
export const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
export const unitId = "79e15fc7-4f91-45e3-abbb-330d35956510";
export const otherId = "02157256-a433-4895-a50d-ea5d67beb3b9";
export const item = itemSchema.parse({
  id,
  name: "Disposable gloves",
  code: "GLV001",
  store: 0,
  classification: 0,
  unitOfMeasure: { id: unitId, name: "Pieces", symbol: "pcs" },
  itemCategory: null,
  minimumLevel: 0,
  maximumLevel: 0,
  reorderLevel: 0,
  availableQuantity: 0,
  isActive: true,
  description: "",
  attachments: [],
});
