export const listPath = "/qc/product-analytical-raw-data";
export const detailPath = (id: string) => `${listPath}/${id}`;
export const ardPermissions = { view: "CanViewProductArds", create: "CanCreateProductArd", edit: "CanEditProductArd", remove: "CanDeleteProductArd", verify: "CanVerifyProductArd" } as const;
