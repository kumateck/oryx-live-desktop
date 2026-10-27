import { useEffect, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { ReportFilters, ReportSelectName } from "../schemas/report-filters";
import { reportSelection } from "../lib/selections";

const parents = ["asOfDate", "materialKind", "supplier", "manufacturer", "store", "division", "department", "warehouseType"] as const;
type Parent = typeof parents[number];
const parentKeys = (values: ReportFilters) => parents.map((name) => name === "asOfDate"
  ? values.asOfDate?.toISOString() ?? ""
  : reportSelection(values, name).map((option) => option.value).sort().join(","));
const dependents: Record<Parent, readonly ReportSelectName[]> = {
  asOfDate: ["department", "material", "category", "product", "warehouse", "item"],
  materialKind: ["material", "category", "supplier", "manufacturer"],
  supplier: ["manufacturer", "material"], manufacturer: ["material"],
  store: ["item", "category"], division: ["product"], department: ["product"], warehouseType: ["warehouse", "department"],
};

/** Clear invalid children when their scope changes; initial values and form reset stay intact. */
export function useDependentReportFilters(form: UseFormReturn<ReportFilters>) {
  const keys = useWatch({ control: form.control, compute: parentKeys });
  const previous = useRef(keys);
  useEffect(() => {
    const changed = parents.filter((parent, index) => previous.current[index] !== keys[index]);
    previous.current = keys;
    for (const child of new Set(changed.flatMap((parent) => dependents[parent]))) {
      form.setValue(child, null);
      form.setValue(`selections.${child}`, []);
    }
  }, [form, keys]);
  return (next: ReportFilters) => { previous.current = parentKeys(next); form.reset(next); };
}
