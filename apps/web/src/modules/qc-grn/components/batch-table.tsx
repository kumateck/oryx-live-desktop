import { useMemo, useState } from "react";
import { ClipboardCheck, Eye, FlaskConical, Pipette, Play, Printer, Target, UserCog } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { AssignmentsDialog } from "@/shared/qc/assignment-views";
import { formAssigneeSchema } from "@/shared/qc/assignments";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { qcGrnAnalyticalApi, qcGrnFormsApi } from "../api/qc-grn-api";
import { batchActions, batchPath, batchStatusLabels, printsFilled, qcGrnAudit, qcPermissions } from "../lib/qc-grn";
import type { QcBatch } from "../schemas/grn-schema";
import { RequestMaterialRetestDialog, retestPermissions } from "@/modules/material-retests/public";
import { SampleDialog } from "./batch-dialogs";
import { BatchWorksheetPrint } from "./batch-worksheet";

type Open = { kind: "sample" | "requestRetest" | "assignments" | "print" | "start"; batch: QcBatch } | null;
const shown = (value: number | null, unit: string | null) => value === null ? "–" : toLargestUnit(value, unit, "calculated")?.text ?? "–";
const column = dataTableColumns<QcBatch>();

function Assignments({ batch, onClose }: { batch: QcBatch; onClose: () => void }) {
  const query = qcGrnFormsApi.useGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery({ ...qcGrnAudit, materialBatchId: batch.id });
  const parsed = useMemo(() => { const result = formAssigneeSchema.safeParse(query.data ?? null); return result.success ? result.data : null; }, [query.data]);
  return <AssignmentsDialog assignees={parsed} loading={query.isLoading} error={query.error ? apiErrorMessage(query.error) : null} onClose={onClose} />;
}

/** The batches of a note and, for each, the QC step its status allows. */
export function BatchTable({ grnId, kind, batches }: { grnId: string; kind: MaterialKind; batches: readonly QcBatch[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Open>(null);
  const [loadArd] = qcGrnAnalyticalApi.useLazyGetApiV1MaterialArdMaterialBatchByMaterialBatchIdQuery();
  const [startTest] = qcGrnAnalyticalApi.usePutApiV1MaterialArdStartTestByMaterialBatchIdMutation();
  const tester = usePermissionAction(qcPermissions.test[kind]);
  const columns = useMemo(() => column.columns([
    column.accessor("material", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.material}</div>
      <div className="text-xs text-muted-foreground">{row.original.code ?? "No code"} · Batch {row.original.number ?? "–"}</div></div> }),
    column.display({ id: "parties", header: "Supplier / manufacturer", cell: ({ row }) => <div className="text-xs"><div>{row.original.supplier ?? "–"}</div><div className="text-muted-foreground">{row.original.manufacturer ?? "–"}</div></div> }),
    column.display({ id: "quantity", header: "Quantity", size: 150, cell: ({ row }) => <div className="text-xs"><div>Received {shown(row.original.received, row.original.unit)}</div><div className="text-muted-foreground">Sample {shown(row.original.sampled, row.original.unit)}</div></div> }),
    column.display({ id: "references", header: "References", size: 180, cell: ({ row }) => <div className="text-xs"><div>AR {row.original.arNumber ?? "–"}</div><div>Issue {row.original.issueNumber ?? "–"}</div>
      <div className="text-muted-foreground">Invoice {row.original.invoice ?? "–"}</div></div> }),
    column.display({ id: "sampling", header: "Sampling", size: 180, cell: ({ row }) => <div className="text-xs"><div>{row.original.sampledBy ?? "Not sampled"}</div><div className="text-muted-foreground">{formatDate(row.original.sampledOn) ?? ""}</div>
      {row.original.analysts.length ? <div className="text-muted-foreground">Analysed by {row.original.analysts.join(", ")}</div> : null}</div> }),
    column.display({ id: "dates", header: "Dates", size: 150, cell: ({ row }) => <div className="text-xs"><div>Made {formatMonthYear(row.original.made) ?? "–"}</div><div>Expires {formatMonthYear(row.original.expires) ?? "–"}</div>
      <div className="text-muted-foreground">Retest {formatDate(row.original.retest) ?? "–"}</div></div> }),
    column.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 130, cell: ({ row }) => <Badge variant="outline">{row.original.status === null ? "–" : batchStatusLabels[row.original.status] ?? "Unknown"}</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const batch = row.original; const actions = batchActions(batch.status);
      return <TableMenu label={`Actions for batch ${batch.number ?? batch.material}`} items={[
        actions.has("sample") && { id: "sample", label: "Take sample", icon: Pipette, require: qcPermissions.sample[kind], onSelect: () => setOpen({ kind: "sample", batch }) },
        actions.has("assign") && { id: "assign", label: "Assign test", icon: Target, require: qcPermissions.test[kind], to: batchPath(grnId, batch.id, kind, "assign") },
        actions.has("start") && { id: "start", label: "Start test", icon: Play, require: qcPermissions.test[kind], onSelect: () => setOpen({ kind: "start", batch }) },
        actions.has("continue") && { id: "continue", label: "Enter results", icon: FlaskConical, require: qcPermissions.test[kind], to: batchPath(grnId, batch.id, kind, "test") },
        actions.has("reassign") && { id: "reassign", label: "Reassign analysts", icon: UserCog, require: qcPermissions.reassign[kind], to: batchPath(grnId, batch.id, kind, "reassign") },
        actions.has("assignments") && { id: "assignments", label: "View assignments", icon: Eye, onSelect: () => setOpen({ kind: "assignments", batch }) },
        actions.has("check") && { id: "check", label: "Check results", icon: ClipboardCheck, require: qcPermissions.check[kind], to: batchPath(grnId, batch.id, kind) },
        actions.has("requestRetest") && { id: "requestRetest", label: "Request retest", icon: FlaskConical, require: retestPermissions.request, separated: true, onSelect: () => setOpen({ kind: "requestRetest", batch }) },
        batch.status === 5 && { id: "retests", label: "Open governed retests", icon: FlaskConical, require: retestPermissions.view, to: `/qc/material-retests?batchId=${encodeURIComponent(batch.id)}` },
        actions.has("print") && { id: "print", label: printsFilled(batch.status) ? "Print worksheet with results" : "Print blank worksheet", icon: Printer, require: qcPermissions.test[kind], separated: true, onSelect: () => setOpen({ kind: "print", batch }) },
      ]} />; } }),
  ]), [grnId, kind]);
  const start = async (batch: QcBatch): Promise<string | null> => {
    const denied = tester.check();
    if (denied) return denied;
    // The test can only start once the material has analytical raw data with a test form.
    const ard = await loadArd({ ...qcGrnAudit, materialBatchId: batch.id });
    if (ard.error) return `This material has no analytical raw data linked, so its test cannot start. ${apiErrorMessage(ard.error)}`;
    const result = await startTest({ ...qcGrnAudit, materialBatchId: batch.id });
    if ("error" in result) return apiErrorMessage(result.error);
    void navigate(batchPath(grnId, batch.id, kind, "test"));
    return null;
  };
  return <>
    <ListDataTable label="Batches on this note" columns={columns} rows={batches} getRowId={(row) => row.id} emptyTitle="No batches on this note" />
    {open?.kind === "sample" ? <SampleDialog grnId={grnId} batch={open.batch} kind={kind} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "requestRetest" ? <RequestMaterialRetestDialog batchId={open.batch.id} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "assignments" ? <Assignments batch={open.batch} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "print" ? <BatchWorksheetPrint batchId={open.batch.id} filled={printsFilled(open.batch.status)} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "start" ? <ConfirmActionDialog require={qcPermissions.test[kind]} destructive={false} title={`Start the test of batch ${open.batch.number ?? open.batch.material}?`}
      description="The batch moves to testing and its assigned analysts can enter results." confirmLabel="Start test" busyLabel="Starting…" onClose={() => setOpen(null)} onConfirm={() => start(open.batch)} /> : null}
  </>;
}
