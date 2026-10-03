export interface CollectionPermissions {
  view: string;
  create: string;
  edit: string;
  delete: string;
}

export interface CollectionDefinition {
  id: string;
  label: string;
  group: string;
  model: string;
  permissions: CollectionPermissions;
  kind?: 0 | 1;
  mode?: "units" | "read-only" | "resource" | "payment";
  description?: boolean;
  nameLimit?: number;
  descriptionLimit?: number;
}

const permissions = (view: string, create: string, edit: string, remove: string): CollectionPermissions => ({ view, create, edit, delete: remove });

/** The types supported by this workspace, with Oryx's exact permission keys. */
export const collections: readonly CollectionDefinition[] = [
  { id: "product-categories", label: "Product categories", group: "Categories", model: "ProductCategory", description: true,
    permissions: permissions("CanViewProductCategories", "CanCreateProductCategory", "CanEditProductCategory", "CanDeleteProductCategory") },
  { id: "raw-categories", label: "Raw material categories", group: "Categories", model: "MaterialCategory", kind: 0, description: true,
    permissions: permissions("CanViewRawCategories", "CanCreateRawCategory", "CanEditRawCategory", "CanDeleteRawCategory") },
  { id: "package-categories", label: "Packaging categories", group: "Categories", model: "MaterialCategory", kind: 1, description: true,
    permissions: permissions("CanViewPackageCategories", "CanCreatePackageCategory", "CanEditPackageCategory", "CanDeletePackageCategory") },
  { id: "item-categories", label: "Item categories", group: "Categories", model: "ItemCategory",
    permissions: permissions("CanViewItemCategory", "CanCreateItemCategory", "CanEditItemCategory", "CanDeleteItemCategory") },
  { id: "equipment-categories", label: "QC equipment categories", group: "Categories", model: "QcEquipmentCategory", nameLimit: 10000,
    permissions: permissions("CanViewEquipmentCategory", "CanCreateEquipmentCategory", "CanEditEquipmentCategory", "CanDeleteEquipmentCategory") },
  { id: "resources", label: "Resources", group: "Procedures", model: "Resource", mode: "resource",
    permissions: permissions("CanViewResources", "CanCreateResource", "CanEditResource", "CanDeleteResource") },
  { id: "operations", label: "Operations", group: "Procedures", model: "Operation", description: true,
    permissions: permissions("CanViewOperations", "CanCreateOperation", "CanEditOperation", "CanDeleteOperation") },
  { id: "work-centers", label: "Work centers", group: "Procedures", model: "WorkCenter", description: true,
    permissions: permissions("CanViewWorkCenters", "CanCreateWorkCenter", "CanEditWorkCenter", "CanDeleteWorkCenter") },
  { id: "sites", label: "Sites", group: "Procedures", model: "Site", description: true, nameLimit: 100,
    permissions: permissions("CanViewSite", "CanCreateSite", "CanEditWorkSite", "CanDeleteSite") },
  { id: "material-types", label: "Material types", group: "Products", model: "MaterialType", description: true,
    permissions: permissions("CanViewMaterialTypes", "CanCreateMaterialType", "CanEditMaterialType", "CanDeleteMaterialType") },
  { id: "units", label: "Units of measure", group: "Products", model: "UnitOfMeasure", mode: "units", description: true,
    permissions: permissions("CanViewUnitOfMeasure", "CanCreateUnitOfMeasure", "CanEditUnitOfMeasure", "CanDeleteUnitOfMeasure") },
  { id: "package-styles", label: "Package styles", group: "Products", model: "PackageStyle", description: true,
    permissions: permissions("CanViewPackageStyle", "CanCreatePackageStyle", "CanEditPackageStyle", "CanDeletePackageStyle") },
  { id: "product-states", label: "Product states", group: "Products", model: "ProductState",
    permissions: permissions("CanViewProductState", "CanCreateProductState", "CanEditProductState", "CanDeleteProductState") },
  { id: "countries", label: "Countries", group: "Address", model: "Country", mode: "read-only",
    permissions: permissions("CanViewCountries", "CanCreateCountries", "CanEditCountries", "CanDeleteCountries") },
  { id: "shift-categories", label: "Shift categories", group: "Schedules", model: "ShiftCategory",
    permissions: permissions("CanViewShiftCategories", "CanCreateShiftCategory", "CanEditShiftCategory", "CanDeleteShiftCategory") },
  { id: "payment-terms", label: "Payment terms", group: "Payments", model: "TermsOfPayment", mode: "payment", description: true,
    permissions: permissions("CanViewPaymentTerms", "CanCreatePaymentTerm", "CanEditPaymentTerm", "CanDeletePaymentTerm") },
  { id: "delivery-modes", label: "Delivery modes", group: "Payments", model: "DeliveryMode", description: true,
    permissions: permissions("CanViewDeliveryModes", "CanCreateDeliveryMode", "CanEditDeliveryMode", "CanDeleteDeliveryMode") },
  { id: "charges", label: "Charges", group: "Payments", model: "Charge", description: true, nameLimit: 100, descriptionLimit: 100,
    permissions: permissions("CanViewCharges", "CanCreateCharges", "CanEditCharges", "CanDeleteCharges") },
];

export const collectionViewPermissions = collections.map((item) => item.permissions.view);
export const collectionAudit = { module: "Settings", subModule: "Configurations" };

export function collectionEditReason(definition: CollectionDefinition): string | null {
  if (definition.mode === "resource") return "Resource type and availability cannot be retrieved for a safe edit.";
  if (definition.mode === "payment") return "The current payment terms cannot be retrieved with their due days for a safe edit.";
  if (definition.mode === "read-only") return "This collection is available for selection only.";
  return null;
}

export function chooseCollection(visible: readonly CollectionDefinition[], selected: string | null): CollectionDefinition | null {
  return visible.find((item) => item.id === selected) ?? (selected ? null : visible[0] ?? null);
}
