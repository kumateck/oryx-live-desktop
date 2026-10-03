import type { DomainEntitiesProcurementSuppliersSupplierManufacturerDto } from "@/shared/api/generated/procurement";

export interface MaterialChoice {
  key: string; materialId: string; materialName: string; uomId: string; uomName: string; uomSymbol: string;
}

export function materialChoices(associations: readonly DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] = []): MaterialChoice[] {
  const choices = new Map<string, MaterialChoice>();
  for (const { material, uoM } of associations) {
    if (!material?.id || !uoM?.id) continue;
    const key = `${material.id}:${uoM.id}`;
    if (choices.has(key)) continue;
    const uomSymbol = uoM.symbol?.trim() || uoM.name?.trim() || "unit";
    choices.set(key, {
      key, materialId: material.id, materialName: material.name?.trim() || "Unnamed material",
      uomId: uoM.id, uomName: uoM.name?.trim() || uomSymbol, uomSymbol,
    });
  }
  return [...choices.values()].sort((a, b) => a.materialName.localeCompare(b.materialName));
}
