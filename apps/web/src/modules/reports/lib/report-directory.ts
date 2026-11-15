import type { AccessRule } from "@/shared/auth/access";
import { reportDefinition } from "./catalog";
import { ReportKey as K, reportPermissions } from "./report-model";

/** Reports are grouped by what they are about, not by the department that owns them. */
export type ReportSectionId = "suppliers" | "purchasing" | "materials" | "production" | "products" | "stores" | "people";
export const reportSections: readonly { id: ReportSectionId; title: string; description: string }[] = [
  { id: "suppliers", title: "Suppliers and manufacturers", description: "Approved sources for every material" },
  { id: "purchasing", title: "Purchasing and shipments", description: "Orders, invoices and inbound shipments" },
  { id: "materials", title: "Materials", description: "Material lists, stock, expiry and valuation" },
  { id: "production", title: "Production and batch records", description: "Schedules, readiness and issued BMRs" },
  { id: "products", title: "Products and finished goods", description: "Products, stock, transfers and invoices" },
  { id: "stores", title: "General stores", description: "Store items, stock and vendor mappings" },
  { id: "people", title: "People", description: "Headcount, movement, leave and attendance" },
];

/** One report as the hub shows it. A report with a summary and a detailed form has one entry with two views. */
export interface ReportEntry {
  slug: string;
  title: string;
  section: ReportSectionId;
  description: string;
  views: readonly { id: string; label: string; key: K }[];
}
const single = (slug: string, section: ReportSectionId, key: K, title = reportDefinition(key).title): ReportEntry =>
  ({ slug, title, section, description: reportDefinition(key).description, views: [{ id: "report", label: title, key }] });
const paired = (slug: string, section: ReportSectionId, title: string, description: string, summary: K, detail: K): ReportEntry =>
  ({ slug, title, section, description, views: [{ id: "summary", label: "Summary", key: summary }, { id: "detail", label: "Detail", key: detail }] });

export const reportEntries: readonly ReportEntry[] = [
  single("approved-manufacturer-list", "suppliers", K.ApprovedManufacturers),
  paired("supplier-manufacturer-mapping", "suppliers", "Supplier and manufacturer mapping", "Which suppliers and manufacturers are mapped to each material, with pack options and validity.", K.SupplierSummary, K.SupplierDetail),
  single("purchase-orders", "purchasing", K.PurchaseOrders, "Purchase orders"),
  single("invoiced-purchase-orders", "purchasing", K.PurchasedOrders),
  single("shipments", "purchasing", K.Shipments, "Shipments"),
  single("material-list", "materials", K.QualityMaterials, "Material list"),
  single("materials-per-department", "materials", K.MaterialList),
  paired("material-stock", "materials", "Material stock", "Material quantities by department, down to batch, expiry and storage location.", K.MaterialStockSummary, K.MaterialStockDetail),
  single("stock-count-sheet", "materials", K.CurrentStock, "Stock count sheet"),
  single("expired-stock", "materials", K.ExpiredStock, "Expired stock"),
  single("inventory-valuation", "materials", K.InventoryValuation, "Inventory valuation"),
  single("monthly-production-schedule", "production", K.MonthlySchedule),
  single("daily-production-schedule", "production", K.DailySchedule),
  single("product-readiness", "production", K.ProductReadiness),
  single("bmr-issued", "production", K.IssuedBmr, "BMR issued"),
  single("product-list", "products", K.ProductList),
  single("department-product-list", "products", K.QualityProducts, "Department product list"),
  paired("product-stock", "products", "Product stock", "Finished product quantities by warehouse and department, down to batch and expiry.", K.ProductStockSummary, K.ProductStockDetail),
  paired("finished-goods-transfers", "products", "Finished goods transfers", "Transferred quantities and batches, with packing, dates and acceptance.", K.TransferSummary, K.TransferDetail),
  single("invoiced-products", "products", K.InvoicedProducts, "Invoiced products"),
  single("store-items", "stores", K.StoreItems),
  single("store-stock", "stores", K.StoreStock),
  paired("vendor-item-mapping", "stores", "Vendor item mapping", "Which vendors supply each store item, with categories, units and quantities.", K.VendorSummary, K.VendorItems),
  single("employee-master-list", "people", K.EmployeeMaster),
  single("staff-grade-count", "people", K.StaffGrade),
  single("staff-total", "people", K.StaffTotal),
  single("staff-gender-ratio", "people", K.GenderRatio),
  single("new-hires-and-exits", "people", K.EmployeeMovement),
  single("staff-turnover", "people", K.StaffTurnover),
  single("leave-overview", "people", K.LeaveOverview),
  single("daily-attendance", "people", K.DailyAttendance),
  single("department-attendance", "people", K.DepartmentAttendance),
];

export function reportEntry(slug: string | undefined): ReportEntry | null {
  return reportEntries.find((entry) => entry.slug === slug) ?? null;
}

/** The permission that opens one view of a report. */
export function viewRequirement(key: K): string {
  return reportPermissions[reportDefinition(key).group];
}

/** A report entry opens when the user may run at least one of its views. Each view keeps its own check. */
export function entryRequirement(entry: ReportEntry): AccessRule {
  return { kind: "some", permissions: [...new Set(entry.views.map((view) => viewRequirement(view.key)))] };
}

/** Where the hub links for a report key, so old pages and other modules can send people to the new page. */
export function reportLink(key: K): string {
  const entry = reportEntries.find((candidate) => candidate.views.some((view) => view.key === key));
  if (!entry) throw new Error(`Report ${key} has no entry in the report directory.`);
  const view = entry.views.length > 1 ? entry.views.find((candidate) => candidate.key === key) : undefined;
  return view ? `/reports/${entry.slug}?view=${view.id}` : `/reports/${entry.slug}`;
}
