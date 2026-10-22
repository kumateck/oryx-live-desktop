import type { ReportDefinition } from "./report-model";
import type { ReportFilters } from "../schemas/report-filters";
import { reportFieldLabels } from "./filter-fields";
export function appliedReportFilters(definition: ReportDefinition, values: ReportFilters) {
  return definition.fields.map((name) => {
    const value = values[name];
    const display = value instanceof Date ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
      : Array.isArray(value) ? value.map((option) => option.label).join(", ") || "All"
      : typeof value === "object" && value !== null ? value.label : value || "All";
    return { label: reportFieldLabels[name], value: display };
  });
}
