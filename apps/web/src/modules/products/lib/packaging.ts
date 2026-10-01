import type { DomainEntitiesProductsCreateProductPackageRequest } from "@/shared/api/generated/products";
import type { SavedPackages } from "../schemas/packaging-schema";

interface Option { value: string; label: string }

/** One packing material of a product being edited. `key` identifies the row on the page. */
export interface PackagingLine {
  key: string;
  material: Option;
  code: string;
  /** Known for a material just chosen from the picker; saved lines look theirs up when shown. */
  specification: string | null;
  /** The packing style this material belongs to, or null when it applies to every style. */
  packing: Option | null;
  prescribedQuantity: number;
  packingExcessMargin: number;
  /**
   * Fields this page does not edit. The backend replaces every packing material on save, so they
   * are sent back unchanged; leaving them out would erase them.
   */
  carried: Pick<DomainEntitiesProductsCreateProductPackageRequest, "baseQuantity" | "unitCapacity" | "baseUoMId" | "directLinkMaterialId"
    | "materialThickness" | "otherStandards" | "substituteMaterialIds">;
}

export function fromSavedPackages(saved: SavedPackages): PackagingLine[] {
  return saved.flatMap((item, index) => item.material?.id ? [{
    key: item.id ?? `saved-${index}`,
    material: { value: item.material.id, label: item.material.name }, code: item.material.code, specification: null,
    packing: item.productPacking?.id ? { value: item.productPacking.id, label: item.productPacking.name } : null,
    prescribedQuantity: item.prescribedQuantity ?? 0, packingExcessMargin: item.packingExcessMargin ?? 0,
    carried: {
      baseQuantity: item.baseQuantity ?? 1, unitCapacity: item.unitCapacity ?? 0,
      directLinkMaterialId: item.directLinkMaterial?.id ?? null,
      materialThickness: item.materialThickness ?? null, otherStandards: item.otherStandards ?? null,
      substituteMaterialIds: item.substitutes.flatMap((entry) => entry.substituteMaterial?.id ? [entry.substituteMaterial.id] : []),
    },
  }] : []);
}

/**
 * Why a material and packing style cannot be added alongside the others, or null when it can.
 * A material is listed either once for all packing styles, or once per packing style, never both.
 */
export function packagingConflict(lines: readonly PackagingLine[], materialId: string, packingId: string | null, exceptKey: string | null): string | null {
  const same = lines.filter((line) => line.key !== exceptKey && line.material.value === materialId);
  if (same.some((line) => (line.packing?.value ?? null) === packingId)) {
    return packingId ? "This material is already listed for this packing style" : "This material is already listed";
  }
  if (packingId && same.some((line) => line.packing === null)) return "This material is already listed for all packing styles. Remove that line to list it per packing style.";
  if (!packingId && same.length > 0) return "This material is listed for specific packing styles. Choose a packing style for this line too.";
  return null;
}

/** Prescribed quantity plus allowance, for the Total column. */
export function packagingTotal(line: Pick<PackagingLine, "prescribedQuantity" | "packingExcessMargin">): number {
  return line.prescribedQuantity + line.packingExcessMargin;
}

export function toPackagesRequest(lines: readonly PackagingLine[]): DomainEntitiesProductsCreateProductPackageRequest[] {
  return lines.map((line) => ({
    ...line.carried,
    materialId: line.material.value,
    productPackingId: line.packing?.value ?? null,
    prescribedQuantity: line.prescribedQuantity,
    packingExcessMargin: line.packingExcessMargin,
    // The backend keeps the allowance in two fields; Oryx Next writes both, and reports read either.
    loose: line.packingExcessMargin,
  }));
}
