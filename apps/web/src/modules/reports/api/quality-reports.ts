import { historyParams } from "../lib/history";
import { singleReportFilters, selectedReportValue } from "../lib/selections";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { materialsApi } from "@/shared/api/generated/materials";
import { reportSheet, reportEnum } from "@/shared/reports/report-data";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice } from "../lib/filter-params";
import { allReportPages } from "./all-pages";
import { reportRequest } from "./request";
import { loadCommercialReport } from "./commercial-reports";
import { loadProductionReadiness } from "./production-readiness";
const options = { subscribe: false, forceRefetch: true };
export async function loadQualityReport(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const f = singleReportFilters(filters);
  if (key === ReportKey.QualityProducts) return loadCommercialReport(dispatch, key, f, signal);
  if (key === ReportKey.QualityMaterials) {
    const kind = binaryChoice(f.materialKind?.value); const kinds: (0 | 1)[] = kind === undefined ? [0, 1] : [kind];
    const rows = (await Promise.all(kinds.map((kind) => allReportPages((page) => reportRequest(dispatch(materialsApi.endpoints.getApiV1Material.initiate({ ...reportsAudit, ...historyParams(filters), kind, page, pageSize: 100 }, options)), signal), (row) => row.id, signal)))).flat();
    return { sheets: [reportSheet("Quality material list", rows.filter((row) => selectedReportValue(filters,"category",row.materialCategory?.id)), [
      { label: "Material", read: (r) => r.name }, { label: "Code", read: (r) => r.code }, { label: "Type", read: (r) => reportEnum(r.kind, ["Raw material", "Packaging material"]) }, { label: "Category", read: (r) => r.materialCategory?.name },
      { label: "Pharmacopoeia", read: (r) => r.pharmacopoeia }, { label: "Alphabet", read: (r) => r.alphabet }, { label: "Unlimited", read: (r) => r.isUnlimited }, { label: "Description", read: (r) => r.description ? richTextToPlain(r.description) : null },
      { label: "Specification", read: (r) => r.specification?.specificationNumber }, { label: "Total stock", read: (r) => r.totalStock }, { label: "Reserved stock", read: (r) => r.reservedStock },
      { label: "Suppliers", read: (r) => r.suppliers?.map((party) => party.name).join(", ") }, { label: "Manufacturers", read: (r) => r.manufacturers?.map((party) => party.name).join(", ") },
    ])] };
  }
  if (![ReportKey.MonthlySchedule, ReportKey.DailySchedule, ReportKey.ProductReadiness].includes(key)) throw new Error("Invalid quality report.");
  return loadProductionReadiness(dispatch, key, filters, signal);
}
