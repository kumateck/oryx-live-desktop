import type { ReportFilters, ReportSelectName } from "../schemas/report-filters";
import type { ReportDefinition, ReportOutput } from "../lib/report-model";
import { reportFieldLabels } from "../lib/filter-fields";
import { reportSelection } from "../lib/selections";
import { ReportKey } from "../lib/report-model";

const materialScopes = new Set([ReportKey.MaterialStockSummary, ReportKey.MaterialStockDetail, ReportKey.InventoryValuation]);
const productScopes = new Set([ReportKey.TransferSummary, ReportKey.TransferDetail, ReportKey.ProductStockSummary, ReportKey.ProductStockDetail, ReportKey.InvoicedProducts]);

/** Scalar scope endpoints retain their authoritative totals; sections never imply an unsafe sum. */
export async function loadScopedReport(definition: ReportDefinition, filters: ReportFilters, signal: AbortSignal, load: (filters: ReportFilters) => Promise<ReportOutput>): Promise<ReportOutput> {
  const scopes: { filters: ReportFilters; labels: string[] }[] = [{ filters, labels: [] }];
  const names: ReportSelectName[] = ["department", "warehouse", "customer", "vendor"];
  if (materialScopes.has(definition.key)) names.push("material");
  if (productScopes.has(definition.key)) names.push("product");
  for (const name of names) {
    if (!definition.fields.includes(name)) continue;
    const options = reportSelection(filters, name);
    if (options.length < 2) continue;
    const previous = scopes.splice(0);
    for (const scope of previous) for (const option of options) scopes.push({
      filters: { ...scope.filters, [name]: option, selections: { ...scope.filters.selections, [name]: [] } },
      labels: [...scope.labels, `${reportFieldLabels[name]}: ${option.label}`],
    });
  }
  const outputs: ReportOutput[] = [];
  for (let start = 0; start < scopes.length; start += 4) {
    if (signal.aborted) throw new Error("Report generation was cancelled.");
    const batch = scopes.slice(start, start + 4);
    const results = await Promise.all(batch.map(async (scope) => {
      const output = await load(scope.filters);
      return scope.labels.length ? { ...output, sheets: output.sheets.map((sheet) => ({ ...sheet, name: `${sheet.name} · ${scope.labels.join(" · ")}` })) } : output;
    }));
    outputs.push(...results);
  }
  return { sheets: outputs.flatMap((output) => output.sheets), warnings: [...new Set(outputs.flatMap((output) => output.warnings ?? [])), ...(scopes.length > 1 ? ["Results are separated by selected scope. Each section's totals apply to that scope; overlapping department assignments must not be added together."] : [])] };
}
