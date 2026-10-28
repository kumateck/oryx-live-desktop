import { reportDate } from "@/shared/reports/report-data";
import { DataTableFooter } from "@/shared/datatable";
import { useReadinessPage } from "../hooks/use-readiness-page";
import type { ReadinessView } from "../schemas/production-readiness";
import { ProductionScheduleTable } from "./production-schedule-table";
import { ProductReadinessTable } from "./product-readiness-table";
import { ReadinessLegend } from "./readiness-status";
import "./production-readiness.css";

export function ProductionReadinessView({ view, paper = false }: { view: ReadinessView; paper?: boolean }) {
  const { report, mode } = view;
  const page = useReadinessPage(view, paper);
  const period = report.startDate === report.endDate ? reportDate(report.startDate)
    : `${reportDate(report.startDate)} – ${reportDate(report.endDate)}`;
  return <section className="production-readiness" aria-label={mode === "schedule" ? "Production readiness report" : "Product readiness report"}>
    <div className="readiness-scope"><h2>{report.departmentName}</h2><p>{period} <span className="text-muted-foreground">· UTC</span></p></div>
    <div className="readiness-summary" role="status">
      <strong>{report.readyProductCount} of {report.productCount} products ready</strong>
      {report.actionNeededProductCount ? <span>{report.actionNeededProductCount} need configuration</span> : null}
      {report.unavailableProductCount ? <span>{report.unavailableProductCount} could not be verified</span> : null}
    </div>
    {report.productCount === 0 ? <div className="readiness-empty"><h3>No production planned</h3>
      <p>No scheduled products match this department and date range. Edit filters to choose another period.</p></div>
      : mode === "schedule" ? <ProductionScheduleTable report={report} markets={page.markets} paged={page.paged} paper={paper} /> : <ProductReadinessTable products={page.products} paper={paper} />}
    {page.paged ? <><DataTableFooter paging={page.paging} rowsOnPage={page.rowsOnPage} refreshing={false} selectedCount={null} />
      <p className="readiness-note">Totals cover all rows. Print and export include the complete report.</p></> : null}
    <ReadinessLegend />
    <p className="readiness-note">Current configuration checks; stock availability and production approval are checked separately.</p>
  </section>;
}
