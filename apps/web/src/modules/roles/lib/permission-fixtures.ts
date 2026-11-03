import type { PermissionModule } from "../schemas/permission-schema";

export const permissionFixture: PermissionModule[] = [{ module: "Procurement", isActive: true, children: [
  { key: "view", name: "View suppliers", description: "Read supplier records", subModule: "Suppliers", hasOptions: false, types: ["Access"] },
  { key: "edit", name: "Edit suppliers", description: null, subModule: "Suppliers", hasOptions: false, types: [] },
  { key: "purchase", name: "Create orders", description: null, subModule: "Orders", hasOptions: false, types: [] },
] }, { module: "Finance", isActive: true, children: [
  { key: "pay", name: "Pay invoices", description: null, subModule: null, hasOptions: false, types: ["Access"] },
] }];

export const openingBalancePermissionFixture: PermissionModule[] = [
  { module: "Settings", isActive: false, children: [
    ...["View", "Upload", "Correct", "Approve"].map((action) => ({ key: `Can${action}OpeningBalances`, name: `${action} opening balances`, description: "Manage opening stock balances.", subModule: "Opening Balances", hasOptions: false, types: [] })),
    { key: "CanViewProductCategory", name: "View product category", description: null, subModule: "Product Category", hasOptions: false, types: [] },
  ] },
  { module: "Procurement", isActive: false, children: [
    { key: "CanViewForeignPurchaseOrder", name: "Can View Foreign Purchase Order", description: "Allows the user to view foreign purchase order.", subModule: "Create Purchase Orders Page", hasOptions: false, types: [] },
    { key: "CanCreateForeignPurchaseOrder", name: "Can Create Foreign Purchase Order", description: "Allows the user to create foreign purchase order.", subModule: "Create Purchase Orders Page", hasOptions: false, types: [] },
  ] },
];
