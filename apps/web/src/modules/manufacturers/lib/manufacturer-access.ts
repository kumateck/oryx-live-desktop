export const manufacturersPath = "/settings/manufacturers";
export const manufacturerPermissions = {
  view: "CanViewManufacturers", create: "CanCreateManufacturer", edit: "CanUpdateManufacturerDetails", delete: "CanDeleteManufacturer",
} as const;
export const manufacturerAudit = { module: "Settings", subModule: "Manufacturers" } as const;
export const manufacturerPath = (id: string) => `${manufacturersPath}/${id}`;
