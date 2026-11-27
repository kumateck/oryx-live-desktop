// The backend's keys for structured STP revisions (oryx-backend PermissionKeys, Quality Control → Material STP / Product STP).
// Each task has a key per kind; the kind of an existing revision is the stored one, never the address.
export type StpKind = 0 | 1 | 2;
export const StpKinds = { RawMaterial: 0, PackagingMaterial: 1, Product: 2 } as const;
const variant: Record<StpKind, string> = { 0: "RawMaterial", 1: "PackagingMaterial", 2: "Product" };
export const stpKindLabel: Record<StpKind, string> = { 0: "Raw material", 1: "Packaging material", 2: "Product" };

export interface StpRevisionKeys {
  view: string; create: string; import: string; editDraft: string; submit: string; edit: string;
  revise: string; review: string; return: string; approve: string; reject: string; delete: string;
  export: string; print: string;
}

export function stpRevisionKeys(kind: StpKind): StpRevisionKeys {
  const v = variant[kind];
  return {
    view: `CanView${v}StpRevisions`, create: `CanCreate${v}StpRevision`, import: `CanImport${v}StpRevision`,
    editDraft: `CanEdit${v}StpRevisionDraft`, submit: `CanSubmit${v}StpRevision`, edit: `CanEdit${v}StpRevision`,
    revise: `CanRevise${v}StpRevision`, review: `CanReview${v}StpRevision`, return: `CanReturn${v}StpRevision`,
    approve: `CanApprove${v}StpRevision`, reject: `CanReject${v}StpRevision`, delete: `CanDelete${v}StpRevision`,
    export: `CanExport${v}StpRevision`, print: `CanPrint${v}StpRevision`,
  };
}

export const isStpKind = (value: number | null | undefined): value is StpKind => value === 0 || value === 1 || value === 2;
export const stpRevisionModelType = "StpRevision";
export const stpRevisionAudit = { module: "Quality Control", subModule: "STP Revisions" } as const;

/** Where each page of one kind's revisions lives; the material and product modules own the routes. */
export interface StpRevisionRoutes {
  list: (stpNumber?: string | null) => string;
  detail: (id: string) => string;
  draft: (id: string) => string;
  correct: (id: string) => string;
  create: (stpNumber: string) => string;
  import: (stpNumber: string, stpId?: string | null) => string;
}
/** The routes for a kind: a material revision's links carry its kind in the address. */
export type StpRoutesFor = (kind: StpKind) => StpRevisionRoutes;

/** Citing an STP test is part of the specification: its view key to read, its edit key to change, in its kind. */
export function specificationLinkKeys(kind: StpKind): { view: string; edit: string } {
  return kind === 2 ? { view: "CanViewProductSpecifications", edit: "CanEditProductSpecification" }
    : kind === 1 ? { view: "CanViewPackagingMaterialSpecifications", edit: "CanEditPackagingMaterialSpecification" }
      : { view: "CanViewRawMaterialSpecifications", edit: "CanEditRawMaterialSpecification" };
}
