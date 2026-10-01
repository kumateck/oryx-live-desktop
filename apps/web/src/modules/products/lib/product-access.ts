/** Same address as Oryx Next, so links and bookmarks carry over. */
export const productsPath = "/production/products";
export const productDetailPath = (id: string) => `${productsPath}/${id}/details`;

export const productEditPath = (id: string) => `${productsPath}/${id}/edit/info`;

export const productPermissions = {
  view: "CanViewPlannedProducts",
  create: "CanCreateNewProductionPlan",
  edit: "CanEditProductionPlan",
  verify: "CanVerifyProduct",
} as const;

export const audit = { module: "Production", subModule: "Planning" } as const;

/** The verification endpoint's entity number for a product. */
export const productEntity = 0;

const divisions = ["Beta-lactam", "Non-beta-lactam"] as const;
export function divisionLabel(division: number | null | undefined): string | null {
  return division === 0 || division === 1 ? divisions[division] : null;
}
