import type { PermissionModule } from "../schemas/permission-schema";

export const permissionFixture: PermissionModule[] = [{ module: "Procurement", isActive: true, children: [
  { key: "view", name: "View suppliers", description: "Read supplier records", subModule: "Suppliers", hasOptions: false, types: ["Access"] },
  { key: "edit", name: "Edit suppliers", description: null, subModule: "Suppliers", hasOptions: false, types: [] },
  { key: "purchase", name: "Create orders", description: null, subModule: "Orders", hasOptions: false, types: [] },
] }, { module: "Finance", isActive: true, children: [
  { key: "pay", name: "Pay invoices", description: null, subModule: null, hasOptions: false, types: ["Access"] },
] }];
