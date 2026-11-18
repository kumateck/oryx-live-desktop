import { useMemo, type ReactNode } from "react";
import { useParams } from "react-router";
import { qcApi } from "@/shared/api/generated/qc";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { BatchAssignPage, BatchProgressPage, BatchReassignPage, BatchResultsPage, BatchRouteContext, BatchTestPage, type BatchRoute } from "@/modules/qc-grn/public";
import { resultsSubmitted, retestAudit as audit, retestPath, retestSchema, retestStatuses, retestTestPath } from "../schemas/retest";

const root = "/qc/material-retests";
const steps = { "": "results", assign: "assign", reassign: "reassign", test: "test", progress: "progress" } as const;

/**
 * Runs the material batch test for a retest, like an analytical test request: the retest's batch and sample, its own
 * pages and links back to the retest. Only an acknowledged retest has a sample to test.
 */
function RetestTest({ children }: { children: ReactNode }) {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcMaterialRetestsByIdQuery({ ...audit, id });
  const parsed = useMemo(() => query.data ? retestSchema.safeParse(query.data) : null, [query.data]);
  const record = parsed?.success ? parsed.data : null;
  const route = useMemo((): BatchRoute | null => record ? {
    grnId: null, batchId: record.materialBatchId, kind: record.materialKind, ready: Boolean(record.materialSamplingId),
    notePath: retestPath(record.id), backLabel: "Back to the retest", path: (step) => retestTestPath(record.id, steps[step]),
    crumbs: [{ label: "Material retests", to: root }, { label: record.batchNumber ?? "Retest", to: retestPath(record.id) }],
    sampling: { arNumber: record.arNumber ?? null, sampleDate: record.sampleTakenAt ?? null }, submitted: resultsSubmitted(record.status),
  } : null, [record]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading retest" />;
  if (!route || !record) return <p role="alert" className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "This retest could not be read."}</p>;
  if (!record.materialSamplingId) return <p role="status" className="text-sm text-muted-foreground">
    This retest is {retestStatuses[record.status].toLowerCase()}. Its test opens once QC acknowledges the sample.</p>;
  return <BatchRouteContext.Provider value={route}>{children}</BatchRouteContext.Provider>;
}

export const RetestAssignPage = () => <RetestTest><BatchAssignPage /></RetestTest>;
export const RetestReassignPage = () => <RetestTest><BatchReassignPage /></RetestTest>;
export const RetestTestPage = () => <RetestTest><BatchTestPage /></RetestTest>;
export const RetestProgressPage = () => <RetestTest><BatchProgressPage /></RetestTest>;
export const RetestResultsPage = () => <RetestTest><BatchResultsPage /></RetestTest>;
