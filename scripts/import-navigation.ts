// Ports the Oryx Next sidebar tree into the desktop navigation catalog.
// Run with `bun run nav:import` while both applications are maintained side by side.
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectionViewPermissions } from "../apps/web/src/modules/collection-configurations/lib/collections.ts";
import { passwordAdminEmail } from "../apps/web/src/shared/auth/password-admin.ts";
import { userPasswordsPath } from "../apps/web/src/modules/user-passwords/lib/user-password.ts";
import { anyReportKey } from "../apps/web/src/modules/reports/lib/report-keys.ts";

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
// The compliance page calls certificate endpoints; the source sidebar's broader group
// also includes performance/spend viewers, who would see a link they cannot open.
const complianceIndex = procurement.items.findIndex((item) => item.id === "procurement.supplier-compliance");
const [compliance] = complianceIndex < 0 ? [] : procurement.items.splice(complianceIndex, 1);
if (!compliance) throw new Error("Supplier compliance navigation entry is missing.");
// Quality Assurance approves vendors, so suppliers, manufacturers and their compliance live in its group.
// Procurement keeps using the same records; only the menu moved.
const vendorApproval: CatalogItem[] = [
  { id: "quality-assurance.suppliers", label: "Suppliers", path: "/settings/suppliers", permissions: ["CanViewVendors"] },
  { ...manufacturers, id: "quality-assurance.manufacturers" },
  { ...compliance, id: "quality-assurance.supplier-compliance", permissions: ["CanViewSupplierCertifications"] },
  // The approved manufacturer list for raw materials (QAD/SOP/007/A03-06); its current revision restricts procurement.
  { id: "quality-assurance.approved-vendor-list", label: "Approved Vendor List", path: "/qa/approved-vendor-list", permissions: ["CanViewApprovedVendorList"] },
];

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
fgWarehouse.items.splice(approvedIndex, 0, { id: "fg-warehouse.products", label: "Products", path: "/warehouse/fg-products", permissions: ["CanViewFgProducts"] });

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

const productionPlanning = catalog.find((group) => group.id === "production-planning");
if (!productionPlanning) throw new Error("Production Planning navigation group is missing.");
productionPlanning.items.push({ id: "production-planning.white-placebo", label: "White Placebo", path: "/production/white-placebo", permissions: ["CanViewWhitePlacebo"] });

const qualityAssurance = catalog.find(group => group.id === "quality-assurance");
if (!qualityAssurance) throw new Error("Quality Assurance navigation group is missing.");
qualityAssurance.items.unshift({ id: "quality-assurance.products", label: "Products", path: "/qa/products", permissions: ["CanViewQaProducts"] });
// QA takes material retest samples as it takes analytical test request samples; the entry sits next to that one.
const qaAtrIndex = qualityAssurance.items.findIndex((item) => item.path === "/atr?type=0");
if (qaAtrIndex < 0) throw new Error("QA Analytical Test Requests navigation entry is missing.");
qualityAssurance.items.splice(qaAtrIndex + 1, 0, { id: "quality-assurance.material-retests", label: "Material Retests", path: "/qc/material-retests?tab=sample", permissions: ["CanRecordMaterialRetestSample"] });
qualityAssurance.items.push({ id: "quality-assurance.issued-bmr-records", label: "Issued BMR records", path: "/qa/issued-bmrs", permissions: ["CanViewIssuedBmrRecords"] });
qualityAssurance.items.push(...vendorApproval);

// Document review: records waiting for the caller's review sit next to their pending approvals; who reviews each
// document type is set next to the approval workflows.
const main = catalog.find((group) => group.id === "main");
const pendingIndex = main?.items.findIndex((item) => item.path === "/qa/pending-approvals") ?? -1;
if (!main || pendingIndex < 0) throw new Error("My Pending Approvals navigation entry is missing.");
main.items.splice(pendingIndex + 1, 0, { id: "main.my-pending-reviews", label: "My Pending Reviews", path: "/qa/pending-reviews", permissions: ["CanViewPendingReviews"] });
const approvalsIndex = settings?.items.findIndex((item) => item.path === "/settings/approvals") ?? -1;
if (!settings || approvalsIndex < 0) throw new Error("Approvals navigation entry is missing.");
settings.items.splice(approvalsIndex + 1, 0, { id: "system-settings.document-reviews", label: "Document Reviews", path: "/settings/reviews", permissions: ["CanViewDocumentReviewSettings"] });

// One Reports entry opens the hub, which groups every report by subject and shows only those the user may run.
const reportsGroup = catalog.find((group) => group.id === "reports");
if (!reportsGroup) throw new Error("Reports navigation group is missing.");
// Each report has its own key; any one of them shows the entry.
reportsGroup.items = [{ id: "reports.all-reports", label: "All reports", path: "/reports", permissions: [...anyReportKey] }];

// Oryx Next names some keys the backend never defined, so no role could open those entries. Use the backend's names.
const backendKeys: Readonly<Record<string, string>> = {
  CanViewQcRoutineTests: "CanViewRoutineTests", CanViewQcRoutineSetup: "CanViewRoutineSetup", CanViewQcRoutineWaterQuality: "CanViewWaterQuality",
};
const renameKeys = (items: CatalogItem[]): void => {
  for (const item of items) {
    if (item.permissions) item.permissions = item.permissions.map((key) => backendKeys[key] ?? key);
    if (item.children) renameKeys(item.children);
  }
};
for (const group of catalog) renameKeys(group.items);
// Warehouse entry of stock missed by the opening-balance migration (Settings → Upload Center has the sheet upload).
const stockMovement = catalog.find((group) => group.id === "warehouse-management")?.items.find((item) => item.id === "warehouse-management.stock-movement");
if (!stockMovement?.children || !stockMovement.permissions) throw new Error("Warehouse Stock Movement navigation entry is missing.");
stockMovement.permissions.push("CanViewOpeningBalances");
stockMovement.children.push({ id: "warehouse-management.stock-movement.migration-top-ups", label: "Migration Stock Top-ups", path: "/warehouse/migration-top-ups", permissions: ["CanViewOpeningBalances"] });
// The warehouse plans stock against the month's production schedules with a material forecast per product.
const warehouse = catalog.find(group => group.id === "warehouse-management");
const requestsIndex = warehouse?.items.findIndex((item) => item.id === "warehouse-management.material-requests") ?? -1;
if (!warehouse || requestsIndex < 0) throw new Error("Warehouse Material Requests navigation entry is missing.");
warehouse.items.splice(requestsIndex + 1, 0, { id: "warehouse-management.production-material-forecast", label: "Production Forecast",
  path: "/warehouse/production-forecast", permissions: ["CanViewProductionScheduleMaterialForecast"] });
// Batches whose production has started: the warehouse prepares (and swaps) their reserved lots before the requisition.
warehouse.items.splice(requestsIndex + 2, 0, { id: "warehouse-management.upcoming-batch-issues", label: "Upcoming Batch Issues",
  path: "/warehouse/upcoming-batch-issues", permissions: ["CanViewUpcomingBatchIssues"] });

// Pages whose key changed in the permissions redesign (one key per task and context).
const pageKeys: Readonly<Record<string, string[]>> = {
  "/production/products": ["CanViewProductionProducts"],
  // Dashboards: one view key each.
  "/hr-dashboard": ["CanViewHrDashboard"],
  "/hr-executive-summary": ["CanViewHrExecutiveSummary"],
  "/qa-qc-dashboard/qc": ["CanViewQcDashboard"],
  "/qa-qc-dashboard/qa": ["CanViewQaDashboard"],
  "/warehouse-dashboard": ["CanViewWarehouseDashboard"],
  "/procurement-dashboard": ["CanViewProcurementDashboard"],
  "/logistics-dashboard": ["CanViewLogisticsDashboard"],
  "/services-dashboard": ["CanViewServicesDashboard"],
  "/stores-dashboard": ["CanViewStoresDashboard"],
  "/inventory-command-center": ["CanViewInventoryCommandCenter"],
  "/production-health-dashboard": ["CanViewProductionHealthDashboard"],
  "/fgtn-dashbord": ["CanViewFgtnDashboard"],
  // Handing over one's own approvals; IT hands over anyone's from its own page.
  "/qa/approval-rights-transfer": ["CanTransferApprovalRights"],
};
const setPageKeys = (items: CatalogItem[]): void => {
  for (const item of items) {
    if (item.path && pageKeys[item.path]) item.permissions = [...(pageKeys[item.path] ?? [])];
    if (item.children) setPageKeys(item.children);
  }
};
for (const group of catalog) setPageKeys(group.items);

// IT hands over the approvals of anyone on an approval document, such as a person who left.
const itSupport = catalog.find((group) => group.id === "it-support");
if (!itSupport) throw new Error("IT Support navigation group is missing.");
itSupport.items.push({ id: "it-support.approval-rights-transfer", label: "Transfer Approval Rights", path: "/it/approval-rights-transfer", permissions: ["CanTransferAnyApprovalRights"] });

// Production's requisition list has its own keys; the Warehouse issue list keeps CanViewRawMaterialRequisitions.
const productionRequisitionKeys: Readonly<Record<string, string>> = {
  CanViewRawMaterialRequisitions: "CanViewProductionRawMaterialRequisitions",
  CanViewPackagingMaterialRequisitions: "CanViewProductionPackagingMaterialRequisitions",
};
const useProductionRequisitionKeys = (items: CatalogItem[]): void => {
  for (const item of items) {
    if (item.permissions) item.permissions = item.permissions.map((key) => productionRequisitionKeys[key] ?? key);
    if (item.children) useProductionRequisitionKeys(item.children);
  }
};
for (const group of catalog) if (group.id.startsWith("production")) useProductionRequisitionKeys(group.items);

await writeFile(output, `// Generated by scripts/import-navigation.ts from the Oryx Next sidebar. Do not edit.
import type { NavigationGroup } from "./navigation-model.ts";

export const navigationCatalog = ${JSON.stringify(catalog, null, 2)} as const satisfies readonly NavigationGroup[];

export type NavigationGroupId = (typeof navigationCatalog)[number]["id"];
`);
console.log(`Imported ${catalog.length} groups and ${seen.size - catalog.length} entries.`);
