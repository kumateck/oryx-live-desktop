import type { ApiDispatch } from "@/shared/api/api-provider";
import { productionApi } from "@/shared/api/generated/production";
import { materialsApi } from "@/shared/api/generated/materials";
import { reportSheet, reportEnum } from "@/shared/reports/report-data";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, reportBoundary } from "../lib/filter-params";
import { planSheet, plannedProducts, schedulePlan } from "../lib/schedule-plan";
import { allReportPages } from "./all-pages";
import { reportRequest } from "./request";
import { loadCommercialReport } from "./commercial-reports";
import { readinessSheet } from "./readiness-report";
const options = { subscribe: false, forceRefetch: true };
export async function loadQualityReport(dispatch: ApiDispatch, key: ReportKey, f: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  if (key === ReportKey.QualityProducts) return loadCommercialReport(dispatch, key, f, signal);
  if (key === ReportKey.QualityMaterials) {
    const kind = binaryChoice(f.materialKind?.value); const kinds: (0 | 1)[] = kind === undefined ? [0, 1] : [kind];
    const rows = [];
    for (const kind of kinds) rows.push(...await allReportPages((page) => reportRequest(dispatch(materialsApi.endpoints.getApiV1Material.initiate({ ...reportsAudit, kind, page, pageSize: 100 }, options)), signal), (row) => row.id, signal));
    return { sheets: [reportSheet("Quality material list", rows.filter((row) => !f.category || row.materialCategory?.id === f.category.value), [
      { label: "Material", read: (r) => r.name }, { label: "Code", read: (r) => r.code }, { label: "Type", read: (r) => reportEnum(r.kind, ["Raw material", "Packaging material"]) }, { label: "Category", read: (r) => r.materialCategory?.name },
      { label: "Pharmacopoeia", read: (r) => r.pharmacopoeia }, { label: "Alphabet", read: (r) => r.alphabet }, { label: "Unlimited", read: (r) => r.isUnlimited }, { label: "Description", read: (r) => r.description ? richTextToPlain(r.description) : null },
      { label: "Specification", read: (r) => r.specification?.specificationNumber }, { label: "Total stock", read: (r) => r.totalStock }, { label: "Reserved stock", read: (r) => r.reservedStock },
      { label: "Suppliers", read: (r) => r.suppliers?.map((party) => party.name).join(", ") }, { label: "Manufacturers", read: (r) => r.manufacturers?.map((party) => party.name).join(", ") },
    ])] };
  }
  if (![ReportKey.MonthlySchedule, ReportKey.DailySchedule, ReportKey.ProductReadiness].includes(key)) throw new Error("Invalid quality report.");
  if (!f.department) throw new Error("Choose a department.");
  let start: Date; let end: Date;
  if (key === ReportKey.DailySchedule) { if (!f.date) throw new Error("Choose a date."); start = new Date(reportBoundary(f.date)); end = new Date(reportBoundary(f.date, true)); }
  else { if (!f.month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.month)) throw new Error("Choose a valid month."); start = new Date(`${f.month}-01T00:00:00Z`); end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1); }
  const schedules = await allReportPages((page) => reportRequest(dispatch(productionApi.endpoints.getApiV1ProductionSchedule.initiate({ ...reportsAudit, page, pageSize: 100 }, options)), signal), (row) => row.id, signal);
  const plan = schedulePlan(schedules, start, end, f.department.value);
  const warnings = plan.some((row) => row.expectedYield === null || row.shippers === null) ? ["Some packing definitions are missing yield or packs per shipper. Their output is shown as unrecorded, not zero."] : [];
  if (key === ReportKey.MonthlySchedule) return { sheets: [planSheet(plan)], warnings };
  const readiness = await readinessSheet(dispatch, plannedProducts(plan), signal);
  return { sheets: [planSheet(plan), ...readiness.sheets], warnings: [...warnings, ...readiness.warnings] };
}
