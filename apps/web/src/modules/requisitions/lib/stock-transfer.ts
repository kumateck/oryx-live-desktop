import { convertUnit } from "@/shared/units/quantity";
import type { StockTransferFormValues } from "../schemas/stock-schema";

export interface TransferMaterial { id: string; name: string; code: string | null; unit: string | null; unitId: string | null; stock: number; elsewhere: number }

/** A typed quantity in the unit the material is kept in. */
export function inMaterialUnit(quantity: number, enteredUnit: string, material: Pick<TransferMaterial, "unit">): number {
  return convertUnit(quantity, enteredUnit, material.unit) ?? quantity;
}

export interface SourceProblem { index: number; message: string }

/** A department can be asked once per request; asking it twice is one line with the larger quantity. */
export function sourceProblems(sources: StockTransferFormValues["sources"]): SourceProblem[] {
  const seen = new Set<string>();
  return sources.flatMap((source, index) => {
    const id = source.department?.value;
    if (!id) return [];
    if (seen.has(id)) return [{ index, message: "This department is already on the request" }];
    seen.add(id);
    return [];
  });
}

/** The request as the server stores it. It is always addressed to the user's own department; the server sets that. */
export function stockTransferRequest(material: TransferMaterial, values: StockTransferFormValues) {
  const sources = values.sources.flatMap((source) => source.department ? [{ fromDepartmentId: source.department.value, quantity: inMaterialUnit(source.quantity, source.unit.value, material) }] : []);
  return { code: values.code, materialId: material.id, uoMId: material.unitId, reason: values.reason ?? "", requiredQuantity: sources.reduce((sum, source) => sum + source.quantity, 0), sources };
}
