import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const listPath = "/qc/material-stp";
export const listOf = (kind: MaterialKind) => `${listPath}?type=${String(kind)}`;
// The STP record does not say whether its material is raw or packaging, so the kind travels in the address.
export const detailPath = (id: string, kind: MaterialKind) => `${listPath}/${id}?type=${String(kind)}`;
export const documentPath = (id: string, kind: MaterialKind) => `${listPath}/${id}/document?type=${String(kind)}`;
export const kindName = (kind: MaterialKind) => kind === 1 ? "packaging" : "raw";
export const stpPrefix = (kind: MaterialKind) => `QCD/STP/${kind === 1 ? "PM" : "RM"}`;

/** Oryx Next checked no permission on these pages; each action has its raw and packaging key, and the document's review steps need edit. */
export const stpPermissions = {
  view: { 0: "CanViewRawMaterialStps", 1: "CanViewPackagingMaterialStps" },
  create: { 0: "CanCreateRawMaterialStp", 1: "CanCreatePackagingMaterialStp" },
  edit: { 0: "CanEditRawMaterialStp", 1: "CanEditPackagingMaterialStp" },
  remove: { 0: "CanDeleteRawMaterialStp", 1: "CanDeletePackagingMaterialStp" },
} as const satisfies Record<string, Record<MaterialKind, string>>;
