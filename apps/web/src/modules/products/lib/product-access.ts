/** Same address as Oryx Next, so links and bookmarks carry over. */
export const productsPath = "/production/products";
export const productDetailPath = (id: string) => `${productsPath}/${id}/details`;

export const productEditPath = (id: string, tab = "info") => `${productsPath}/${id}/edit/${tab}`;
export const productCreatePath = `${productsPath}/create`;

export const productPermissions = {
  view: "CanViewPlannedProducts",
  create: "CanCreateNewProductionPlan",
  edit: "CanEditProductionPlan",
  verify: "CanVerifyProduct",
} as const;

/** Analytical raw data has its own permissions: editing a product does not grant them. */
export const productArdPermissions = { create: "CanCreateProductArd", edit: "CanEditProductArd" } as const;

/** Product specifications have their own permissions too. */
export const productSpecificationPermissions = { create: "CanCreateProductSpecification", edit: "CanEditProductSpecification" } as const;

export const audit = { module: "Production", subModule: "Planning" } as const;

/** The verification endpoint's entity number for a product. */
export const productEntity = 0;

const divisions = ["Beta-lactam", "Non-beta-lactam"] as const;
export function divisionLabel(division: number | null | undefined): string | null {
  return division === 0 || division === 1 ? divisions[division] : null;
}
