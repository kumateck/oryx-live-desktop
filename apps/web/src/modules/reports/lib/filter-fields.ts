import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { ReportFilters, ReportFieldName } from "../schemas/report-filters";
import type { ReportDefinition } from "./report-model";
import type { ReportLookup } from "../hooks/use-report-lookups";
export const reportFieldLabels: Record<ReportFieldName, string> = {
  department: "Department", material: "Material", materialKind: "Material type", category: "Category", product: "Product", warehouse: "Warehouse", warehouseType: "Warehouse type",
  supplier: "Supplier", manufacturer: "Manufacturer", vendor: "Vendor", item: "Item", customer: "Customer", store: "Store type", classification: "Classification",
  employeeType: "Employment type", grade: "Grade", status: "Employee status", division: "Division", supplierType: "Supplier type", valuationType: "Valuation type",
  supplierIds: "Suppliers", statuses: "Shipment statuses", startDate: "From date", endDate: "To date", expiryDateFrom: "Expiry from", expiryDateTo: "Expiry to", validityDateFrom: "Validity from", validityDateTo: "Validity to", date: "Date", month: "Month", poNumber: "Purchase order number", batchNumber: "Batch number", materialName: "Material name", supplierName: "Supplier name", manufacturerName: "Manufacturer name",
};
const options = (labels: readonly string[]) => labels.map((label, value) => ({ value: String(value), label }));
const choices = {
  materialKind: options(["Raw material", "Packaging material"]), warehouseType: options(["Raw", "Packaging", "Finished goods", "Production"]),
  store: options(["Equipment store", "General store", "IT store", "Reagent store"]), classification: options(["Recoverable", "Non-recoverable"]),
  employeeType: options(["Casual", "Permanent"]), grade: options(["Junior staff", "Senior staff", "Senior management"]), status: options(["Active", "Inactive", "New"]),
  division: options(["Betalactam", "Non-betalactam"]), supplierType: options(["Foreign", "Local"]),
  valuationType: ["Material", "Item", "Product"].map((value) => ({ value, label: value })),
};
function lookupName(name: ReportFieldName): ReportLookup | null {
  switch (name) { case "department": case "material": case "product": case "warehouse": case "supplier": case "manufacturer": case "vendor": case "item": case "customer": case "category": return name; default: return null; }
}
export function reportFilterFields(definition: ReportDefinition, load: (entity: ReportLookup) => SelectLoader): WizardField<ReportFilters>[] {
  return definition.fields.map((name): WizardField<ReportFilters> => {
    const label = reportFieldLabels[name]; const required = definition.required?.includes(name) ?? false;
    const lookup = lookupName(name);
    if (lookup) return { type: InputTypes.SELECT, name: lookup, label, required, mode: "single", source: "async", loadOptions: load(lookup), placeholder: required ? `Choose ${label.toLowerCase()}` : "All" };
    switch (name) {
      case "supplierIds": return { type: InputTypes.SELECT, name, label, mode: "multiple", source: "async", loadOptions: load("supplier"), placeholder: "All suppliers" };
      case "statuses": return { type: InputTypes.SELECT, name, label, mode: "multiple", source: "sync", options: [{ value: "New", label: "New" }, { value: "AtPort", label: "At port" }, { value: "Cleared", label: "Cleared" }, { value: "InTransit", label: "In transit" }, { value: "Arrived", label: "Arrived" }] };
      case "startDate": case "endDate": case "expiryDateFrom": case "expiryDateTo": case "validityDateFrom": case "validityDateTo": case "date": return { type: InputTypes.DATE, name, label, required };
      case "month": return { type: InputTypes.MONTH, name, label, required };
      case "poNumber": case "batchNumber": case "materialName": case "supplierName": case "manufacturerName": return { type: InputTypes.TEXT, name, label, required };
      case "materialKind": case "warehouseType": case "store": case "classification": case "employeeType": case "grade": case "status": case "division": case "supplierType": case "valuationType": return { type: InputTypes.SELECT, name, label, required, mode: "single", source: "sync", options: choices[name], placeholder: "All" };
      default: throw new Error(`No report field renderer for ${name}`);
    }
  });
}
