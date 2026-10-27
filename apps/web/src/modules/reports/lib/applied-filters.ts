import { isReportSelect, reportSelection } from "./selections";
import type { ReportDefinition } from "./report-model";
import type { ReportFilters } from "../schemas/report-filters";
import { reportFieldLabels } from "./filter-fields";
export function appliedReportFilters(definition: ReportDefinition, values: ReportFilters) {
  return definition.fields.map((name) => {
    if (isReportSelect(name)) return {label:reportFieldLabels[name],value:reportSelection(values,name).map((option)=>option.label).join(", ")||"All"};
    const value = values[name];
    const display = value instanceof Date ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
      : Array.isArray(value) ? value.map((option) => option.label).join(", ") || "All"
      : value || "All";
    return { label: reportFieldLabels[name], value: name === "asOfDate" && !value ? "Current snapshot" : display };
  });
}
