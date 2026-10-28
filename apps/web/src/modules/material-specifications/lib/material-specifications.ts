import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const audit = { module: "Quality Assurance", subModule: "Material Specification" } as const;
export const listPath = "/qc/material-specification";
export const listOf = (kind: MaterialKind) => `${listPath}?type=${String(kind)}`;
export const createPath = (kind: MaterialKind) => `${listPath}/create?type=${String(kind)}`;
export const detailPath = (id: string) => `${listPath}/${id}/details`;
export const editPath = (id: string) => `${listPath}/${id}/edit`;
export const completePath = (id: string) => `${listPath}/${id}/complete`;
export const kindName = (kind: MaterialKind) => kind === 1 ? "packaging" : "raw";

/** Every action has its raw and packaging permission. Oryx Next approved packaging specifications with the raw permission. */
export const specPermissions = {
  view: { 0: "CanViewRawMaterialSpecifications", 1: "CanViewPackagingMaterialSpecifications" },
  create: { 0: "CanCreateRawMaterialSpecification", 1: "CanCreatePackagingMaterialSpecification" },
  edit: { 0: "CanEditRawMaterialSpecification", 1: "CanEditPackagingMaterialSpecification" },
  remove: { 0: "CanDeleteRawMaterialSpecification", 1: "CanDeletePackagingMaterialSpecification" },
  verify: { 0: "CanVerifyRawMaterialSpecification", 1: "CanVerifyPackagingMaterialSpecification" },
} as const satisfies Record<string, Record<MaterialKind, string>>;
/** Completing the tests follows creating or editing, so either permission allows it. */
export const completePermission = (kind: MaterialKind) => ({ kind: "some" as const, permissions: [specPermissions.create[kind], specPermissions.edit[kind]] });
export const asKind = (value: number | null | undefined): MaterialKind | null => value === 0 || value === 1 ? value : null;
