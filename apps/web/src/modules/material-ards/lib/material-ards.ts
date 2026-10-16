import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const listPath = "/qc/analytical-raw-data";
export const listOf = (kind: MaterialKind) => `${listPath}?type=${String(kind)}`;
// The record does not say whether its material is raw or packaging, so the kind travels in the address.
export const detailPath = (id: string, kind: MaterialKind) => `${listPath}/${id}?type=${String(kind)}`;
export const kindName = (kind: MaterialKind) => kind === 1 ? "packaging" : "raw";

/** Each action has its raw and packaging key. Oryx Next approved packaging records with the raw key. */
export const ardPermissions = {
  view: { 0: "CanViewRawMaterialArds", 1: "CanViewPackagingMaterialArds" },
  create: { 0: "CanCreateRawMaterialArd", 1: "CanCreatePackagingMaterialArd" },
  edit: { 0: "CanEditRawMaterialArd", 1: "CanEditPackagingMaterialArd" },
  remove: { 0: "CanDeleteRawMaterialArd", 1: "CanDeletePackagingMaterialArd" },
  verify: { 0: "CanVerifyRawMaterialArd", 1: "CanVerifyPackagingMaterialArd" },
} as const satisfies Record<string, Record<MaterialKind, string>>;
