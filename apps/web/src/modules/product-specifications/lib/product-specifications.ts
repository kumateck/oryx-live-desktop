export const audit = { module: "Quality Assurance", subModule: "Product Specification" } as const;
export const listPath = "/qc/product-specification";
export const createPath = `${listPath}/create`;
export const detailPath = (id: string) => `${listPath}/${id}/details`;
export const editPath = (id: string) => `${listPath}/${id}/edit`;
export const completePath = (id: string) => `${listPath}/${id}/complete`;

export const specPermissions = {
  view: "CanViewProductSpecifications", create: "CanCreateProductSpecification", edit: "CanEditProductSpecification",
  remove: "CanDeleteProductSpecification", verify: "CanVerifyProductSpecification",
} as const;
/** Completing the tests follows creating or editing, so either permission allows it. */
export const completePermission = { kind: "some" as const, permissions: [specPermissions.create, specPermissions.edit] };
