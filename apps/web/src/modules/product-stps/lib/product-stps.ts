export const listPath = "/qc/products-stp";
export const detailPath = (id: string) => `${listPath}/${id}`;
export const documentPath = (id: string) => `${listPath}/${id}/document`;
export const stpPrefix = "QCD/STP/FP";

/** Oryx Next checked no permission on these pages; the document's review steps need edit, as the server requires. */
export const stpPermissions = { view: "CanViewProductStps", create: "CanCreateProductStp", edit: "CanEditProductStp", remove: "CanDeleteProductStp" } as const;
