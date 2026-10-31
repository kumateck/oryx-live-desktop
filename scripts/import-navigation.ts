// Ports the Oryx Next sidebar tree into the desktop navigation catalog.
// Run with `bun run nav:import` while both applications are maintained side by side.
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectionViewPermissions } from "../apps/web/src/modules/collection-configurations/lib/collections.ts";
import { passwordAdminEmail } from "../apps/web/src/shared/auth/password-admin.ts";
import { userPasswordsPath } from "../apps/web/src/modules/user-passwords/lib/user-password.ts";

interface SourceItem {
  title: string;
  url?: string;
  permissionKey?: string;
  permissionGroup?: string[];
  items?: SourceItem[];
  children?: SourceItem[];
}
interface SourceGroup { title: string; menu: SourceItem[] }
interface CatalogItem { id: string; label: string; path?: string; permissions?: string[]; accounts?: string[]; children?: CatalogItem[] }

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "../oryx-next/src/shared/sidebar/permission/navigation.tsx");
const output = resolve(root, "apps/web/src/modules/navigation/catalog.generated.ts");
const loaded: { ROUTES_WITH_PERMISSIONS?: SourceGroup[] } = await import(source);
const groups = loaded.ROUTES_WITH_PERMISSIONS;
if (!Array.isArray(groups) || groups.length === 0) throw new Error(`No sidebar groups exported from ${source}`);

const slug = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Concise desktop labels. Preserve IDs, paths and permission keys from the source tree.
const labels: Readonly<Record<string, string>> = {
  "System Configuration": "General",
  "Configuration Collections": "Collections",
  "Inventory Configuration": "Inventory",
  "Organization Configuration": "Organization",
  "Full Procedures Areas": "Procedure Areas",
  "StandardTest Procedures": "Test Procedures",
  "Production Health Dashboard": "Production Health",
  "Extra Material Requisitions": "Extra Material Requests",
  "About To Expire Materials": "Expiring Materials",
  "Create Purchase Requisitions": "New Requisition",
  "Import Worksheet Templates": "Import Templates",
  "Purchase Requisition Sourcing": "Requisition Sourcing",
  "Vendor Quotation Requests": "Supplier Quote Requests",
  "Service Quotation Response": "Service Quote Responses",
  "Department Employee Export": "Export Department Staff",
  "Shift Schedule Report Upload": "Upload Shift Reports",
};

function convert(item: SourceItem, parentId: string, seen: Set<string>): CatalogItem {
  let id = `${parentId}.${slug(item.title)}`;
  for (let copy = 2; seen.has(id); copy += 1) id = `${parentId}.${slug(item.title)}-${copy}`;
  seen.add(id);
  if (item.url !== undefined && !item.url.startsWith("/")) throw new Error(`${id} has a path that is not app-relative: ${item.url}`);
  // Oryx Next shows an entry when the user holds any key of its group, or its single key.
  const permissions = item.permissionGroup?.length ? item.permissionGroup : item.permissionKey ? [item.permissionKey] : [];
  const children = (item.items ?? item.children ?? []).map((child) => convert(child, id, seen));
  if (!item.url && children.length === 0) throw new Error(`${id} has neither a path nor children.`);
  return {
    id, label: labels[item.title] ?? item.title,
    ...(item.url ? { path: item.url } : {}),
    ...(permissions.length ? { permissions: [...new Set(permissions)] } : {}),
    ...(children.length ? { children } : {}),
  };
}

const seen = new Set<string>();
const catalog = groups.map((group) => {
  const id = slug(group.title);
  if (seen.has(id)) throw new Error(`Duplicate sidebar group: ${group.title}`);
  seen.add(id);
  return { id, label: group.title, items: group.menu.map((item) => convert(item, id, seen)) };
});

// Supplier and manufacturer directories belong to Procurement in the desktop sidebar.
// Keep their existing addresses so saved links and record actions continue to work.
const settings = catalog.find((group) => group.id === "system-settings");
const inventory = settings?.items.find((item) => item.id === "system-settings.inventory-configuration");
if (!inventory?.children) throw new Error("Inventory Configuration navigation group is missing.");
const manufacturerIndex = inventory.children.findIndex((item) => item.path === "/settings/manufacturers");
if (manufacturerIndex < 0) throw new Error("Manufacturers navigation entry is missing.");
const [manufacturers] = inventory.children.splice(manufacturerIndex, 1);
if (!manufacturers) throw new Error("Manufacturers navigation entry could not be moved.");
const directoryPermissions = new Set(["CanViewVendors", "CanViewManufacturers"]);
if (inventory.permissions) inventory.permissions = inventory.permissions.filter((permission) => !directoryPermissions.has(permission));
const settingsRoot = settings?.items.find((item) => item.id === "system-settings.system-configuration");
if (settingsRoot?.permissions) settingsRoot.permissions = settingsRoot.permissions.filter((permission) => !directoryPermissions.has(permission));
const procurement = catalog.find((group) => group.id === "procurement");
if (!procurement) throw new Error("Procurement navigation group is missing.");
procurement.items.unshift(
  { id: "procurement.suppliers", label: "Suppliers", path: "/settings/suppliers", permissions: ["CanViewVendors"] },
  { ...manufacturers, id: "procurement.manufacturers" },
);

// The compliance page calls certificate endpoints; the source sidebar's broader group
// also includes performance/spend viewers, who would see a link they cannot open.
const compliance = procurement.items.find((item) => item.id === "procurement.supplier-compliance");
if (!compliance) throw new Error("Supplier compliance navigation entry is missing.");
compliance.permissions = ["CanViewSupplierCertifications"];

// Every supported collection is independently accessible, including units, sites,
// and shifts. Keep the catalog and module guard on the same permission contract.
const collectionsEntry = settings?.items.find((item) => item.path === "/settings/config");
if (!collectionsEntry) throw new Error("Configuration Collections navigation entry is missing.");
collectionsEntry.permissions = [...collectionViewPermissions];

// The finished goods warehouse manages packing styles for every product of a division, not only products that
// already have approved stock, so it gets a full product list next to Approved Products.
const fgWarehouse = catalog.find((group) => group.id === "fg-warehouse");
const approvedIndex = fgWarehouse?.items.findIndex((item) => item.path === "/warehouse/approved-products") ?? -1;
if (!fgWarehouse || approvedIndex < 0) throw new Error("Approved Products navigation entry is missing.");
fgWarehouse.items.splice(approvedIndex, 0, { id: "fg-warehouse.products", label: "Products", path: "/warehouse/fg-products", permissions: ["CanViewApprovedProducts"] });

// Desktop-only: setting another user's password is limited to one account, not a permission.
// The backend refuses everyone else (UserPasswordAdminRepository.PasswordAdminEmail).
const ownPasswordIndex = settings?.items.findIndex((item) => item.path === "/settings/change-password") ?? -1;
if (!settings || ownPasswordIndex < 0) throw new Error("Change Password navigation entry is missing.");
settings.items.splice(ownPasswordIndex + 1, 0, { id: "system-settings.change-user-password", label: "Change User Password", path: userPasswordsPath, accounts: [passwordAdminEmail] });
// Costing (list prices and customer pricing agreements) is a Finance module in the desktop app.
// It has its own permission, ManageCosting (Finance → Costing on the role permissions page).
const finance = catalog.find((group) => group.id === "finance-and-cashflow");
if (!finance) throw new Error("Finance navigation group is missing.");
finance.items.push({ id: "finance-and-cashflow.costing", label: "Costing", path: "/finance/costing", permissions: ["ManageCosting"] });

await writeFile(output, `// Generated by scripts/import-navigation.ts from the Oryx Next sidebar. Do not edit.
import type { NavigationGroup } from "./navigation-model.ts";

export const navigationCatalog = ${JSON.stringify(catalog, null, 2)} as const satisfies readonly NavigationGroup[];

export type NavigationGroupId = (typeof navigationCatalog)[number]["id"];
`);
console.log(`Imported ${catalog.length} groups and ${seen.size - catalog.length} entries.`);
