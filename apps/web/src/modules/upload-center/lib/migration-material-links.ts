import type { MaterialLinkDto } from "../api/stock-migration-api";
import { openingBalancePermissions } from "./stock-migration";

export type LinkKind = 0 | 1;
export const materialLinkPermissions = { 0: "CanLinkRawMaterials", 1: "CanLinkPackagingMaterials" } as const;
export const materialLinkRequirement = (kind: LinkKind) => ({
  kind: "all", permissions: [openingBalancePermissions.correct, materialLinkPermissions[kind]],
} as const);

// The launcher serves two independent tasks; each group uses its own specific link key.
export const reviewMaterialLinksRequirement = {
  kind: "all", permissions: [openingBalancePermissions.correct],
  anyPermissions: [materialLinkPermissions[0], materialLinkPermissions[1]],
} as const;

export function canLinkMaterial(material: MaterialLinkDto): boolean {
  return Boolean(material.materialId && material.uoMId && !material.issue);
}
