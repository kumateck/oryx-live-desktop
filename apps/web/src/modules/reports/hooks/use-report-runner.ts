import { prepareReportHistory } from "../api/report-history";
import { loadScopedReport } from "../api/scoped-report";
import { useEffect, useRef, useState } from "react";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import type { ReportBook } from "@/shared/reports/report-data";
import { reportRequestFailure, reportFailureMessage } from "../lib/report-failure";
import { loadCommercialReport } from "../api/commercial-reports";
import { loadWarehouseReport } from "../api/warehouse-reports";
import { loadStoreReport } from "../api/store-reports";
import { loadPeopleReport } from "../api/people-reports";
import { loadQualityReport } from "../api/quality-reports";
import { ReportKey, reportPermissions, type ReportDefinition } from "../lib/report-model";
import { reportSelection } from "../lib/selections";
import { appliedReportFilters } from "../lib/applied-filters";
import type { ReportFilters } from "../schemas/report-filters";
export function useReportRunner(definition: ReportDefinition, requirement = reportPermissions[definition.group]) {
  const dispatch = useApiDispatch(); const access = usePermissionAction(requirement);
  const active = useRef<AbortController | null>(null);
  const [book, setBook] = useState<ReportBook | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const cancel = () => { active.current?.abort(); active.current = null; setBusy(false); };
  useEffect(() => () => { active.current?.abort(); }, []);
  const run = async (values: ReportFilters) => {
    active.current?.abort(); setError("");
    const denied = access.check(); if (denied) { setBook(null); setError(denied); return false; }
    const controller = new AbortController(); active.current = controller; setBusy(true);
    let snapshot = structuredClone(values);
    try {
      snapshot = await prepareReportHistory(dispatch, snapshot, controller.signal, true,
        definition.key === ReportKey.MaterialStockDetail && reportSelection(snapshot, "material").length > 0);
      const changed = access.check(); if (changed) { setBook(null); setError(changed); return false; }
      const load = definition.group === "warehouse" ? loadWarehouseReport : definition.group === "stores" ? loadStoreReport
        : definition.group === "hr" ? loadPeopleReport : definition.group === "quality" ? loadQualityReport : loadCommercialReport;
      const output = await loadScopedReport(definition, snapshot, controller.signal, (filters) => load(dispatch, definition.key, filters, controller.signal));
      if (controller.signal.aborted || active.current !== controller) return;
      const revoked = access.check(); if (revoked) { setBook(null); setError(revoked); return false; }
      setBook({ title: definition.title, generatedAt: new Date().toISOString(), filters: appliedReportFilters(definition, snapshot), sheets: output.sheets, warnings: [...(snapshot.asOfInstant ? [`Recorded state as of ${snapshot.asOfInstant}. Dates before recorded history began are unavailable.`] : []), ...(output.warnings ?? [])] });
      return true;
    } catch (reason) {
      if (!controller.signal.aborted && active.current === controller) {
        const parsed = reportRequestFailure.safeParse(reason);
        const revoked = access.check();
        if (revoked || (parsed.success && parsed.data.status === 403)) setBook(null);
        setError(revoked ?? (reason instanceof Error ? reason.message : parsed.success
          ? reportFailureMessage(parsed.data)
          : "The report could not be loaded. Check the connection and retry."));
      }
      return false;
    } finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  };
  return { book, busy, error, run, cancel, reset: () => { cancel(); setBook(null); setError(""); } };
}
