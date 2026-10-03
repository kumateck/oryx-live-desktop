import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
type ByKind = Record<MaterialKind, string>;
export const materialPermissions: Record<"view" | "create" | "edit" | "remove" | "viewLinked" | "editLinked" | "unlink" | "viewUnlinked" | "link", ByKind> = {
  view: { 0: "CanViewRawMaterials", 1: "CanViewPackagingMaterials" }, create: { 0: "CanCreateNewRawMaterials", 1: "CanCreateNewPackagingMaterials" },
  edit: { 0: "CanEditRawMaterials", 1: "CanEditPackagingMaterials" }, remove: { 0: "CanDeleteRawMaterials", 1: "CanDeletePackagingMaterials" },
  viewLinked: { 0: "CanViewLinkedRawMaterials", 1: "CanViewLinkedPackagingMaterials" },
  // The server has an edit key for linked raw materials only; packaging levels are edited by whoever may link packaging.
  editLinked: { 0: "CanEditLinkedRawMaterials", 1: "CanLinkPackagingMaterials" }, unlink: { 0: "CanUnlinkRawMaterials", 1: "CanUnlinkPackagingMaterials" },
  viewUnlinked: { 0: "CanViewUnlinkedRawMaterials", 1: "CanViewUnlinkedPackagingMaterials" }, link: { 0: "CanLinkRawMaterials", 1: "CanLinkPackagingMaterials" },
};
