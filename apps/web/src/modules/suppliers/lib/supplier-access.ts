export const suppliersPath = "/settings/suppliers";
export const supplierPermissions = {
  view: "CanViewVendors", create: "CanCreateVendor", edit: "CanUpdateVendorDetails", delete: "CanDeleteVendor",
} as const;
export const supplierAudit = { module: "Settings", subModule: "Suppliers" } as const;
export const supplierPath = (id: string) => `${suppliersPath}/${id}`;
export const supplierStatus = (status: 0 | 1 | 2 | undefined) =>
  status === 0 ? "New" : status === 1 ? "Approved" : status === 2 ? "Rejected" : "Unspecified";
export const supplierType = (type: 0 | 1 | undefined) => type === 1 ? "Local" : type === 0 ? "Foreign" : "Unspecified";
