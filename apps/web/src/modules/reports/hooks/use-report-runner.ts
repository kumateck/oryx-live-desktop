import { useEffect, useRef, useState } from "react";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import type { ReportBook } from "@/shared/reports/report-data";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
const requestFailure = z.object({ status: z.union([z.number(), z.literal("FETCH_ERROR"), z.literal("PARSING_ERROR"), z.literal("TIMEOUT_ERROR"), z.literal("CUSTOM_ERROR")]), data: z.json().optional(), error: z.string().optional() });
import { loadCommercialReport } from "../api/commercial-reports";
import { loadWarehouseReport } from "../api/warehouse-reports";
import { loadStoreReport } from "../api/store-reports";
import { loadPeopleReport } from "../api/people-reports";
import { loadQualityReport } from "../api/quality-reports";
import { reportPermissions, type ReportDefinition } from "../lib/report-model";
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
    active.current?.abort(); setBook(null); setError("");
    const denied = access.check(); if (denied) { setError(denied); return; }
    const controller = new AbortController(); active.current = controller; setBusy(true);
    const snapshot = structuredClone(values);
    try {
      const load = definition.group === "warehouse" ? loadWarehouseReport : definition.group === "stores" ? loadStoreReport
        : definition.group === "hr" ? loadPeopleReport : definition.group === "quality" ? loadQualityReport : loadCommercialReport;
      const output = await load(dispatch, definition.key, snapshot, controller.signal);
      if (controller.signal.aborted || active.current !== controller) return;
      const revoked = access.check(); if (revoked) { setError(revoked); return; }
      setBook({ title: definition.title, generatedAt: new Date().toISOString(), filters: appliedReportFilters(definition, snapshot), sheets: output.sheets, warnings: output.warnings ?? [] });
    } catch (reason) {
      if (!controller.signal.aborted && active.current === controller) setError(reason instanceof Error ? reason.message : (() => { const parsed = requestFailure.safeParse(reason); return parsed.success && typeof parsed.data.status === "number" ? apiErrorMessage({ status: parsed.data.status, data: parsed.data.data }) : "The report could not be loaded. Check the connection and retry."; })());
    } finally { if (active.current === controller) { active.current = null; setBusy(false); } }
  };
  return { book, busy, error, run, cancel, reset: () => { cancel(); setBook(null); setError(""); } };
}
