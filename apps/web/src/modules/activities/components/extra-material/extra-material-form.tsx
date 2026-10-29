import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery, useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
} from "@/modules/schedules/api/schedule-api";
import { freeStock } from "@/modules/schedules/lib/batch-materials";
import { batchMaterialsSchema } from "@/modules/schedules/schemas/batch-schema";
import { EditableNumberCell, EditableSelectCell, ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import {
  useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery,
  usePostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdMutation,
} from "../../api/activity-api";
import { batchBoardPath } from "../../lib/activity-access";
import { extraMaterialLines, extraMaterialProblem, extraMaterialRequest, type ExtraMaterialLine } from "../../lib/extra-material";

const column = dataTableColumns<ExtraMaterialLine>();
const notRaised = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);
const audit = { module: "Production", subModule: "Extra Stock" } as const;
type Kind = "all" | "raw" | "packaging";
const kinds: readonly { id: Kind; label: string }[] = [{ id: "all", label: "All" }, { id: "raw", label: "Raw" }, { id: "packaging", label: "Packaging" }];

/** Asks the warehouse for more of a batch's materials than was planned. The request waits for approval before anything is issued. */
export function ExtraMaterialForm({ activityId, batchId }: { activityId: string; batchId: string }) {
  const navigate = useNavigate();
  const arg = { ...audit, productionScheduleProductId: batchId };
  const raw = useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery(arg);
  const packaging = useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery(arg);
  // Extra material of a kind needs the batch's main stock requisition of that kind; "not found" means it has not been raised.
  const rawRequisition = useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery(arg);
  const packagingRequisition = useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery(arg);
  const raised = (query: { isSuccess: boolean }) => query.isSuccess;
  const settled = (query: { isSuccess: boolean; error?: object | undefined }) => query.isSuccess || notRaised(query.error);
  const [save, mutation] = usePostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdMutation();
  const [lines, setLines] = useState<ExtraMaterialLine[] | null>(null);
  const [kind, setKind] = useState<Kind>("all");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const loaded = raw.isSuccess && packaging.isSuccess && settled(rawRequisition) && settled(packagingRequisition);
  const rawOpen = raised(rawRequisition);
  const packagingOpen = raised(packagingRequisition);
  // The lines are built once from the batch's materials; what the user types is then kept through any refresh.
  useEffect(() => {
    if (!loaded || lines !== null) return;
    const read = (data: object | undefined) => { const parsed = batchMaterialsSchema.safeParse(data ?? null); return parsed.success ? parsed.data : []; };
    setLines(extraMaterialLines(rawOpen ? read(raw.data) : [], packagingOpen ? read(packaging.data) : []));
  }, [loaded, lines, raw.data, packaging.data, rawOpen, packagingOpen]);

  const all = useMemo(() => lines ?? [], [lines]);
  const shown = useMemo(() => kind === "all" ? all : all.filter((line) => line.kind === kind), [all, kind]);
  const change = (id: string, patch: Partial<Pick<ExtraMaterialLine, "quantity" | "unit">>) => { setMessage(""); setLines((current) => (current ?? []).map((line) => line.material.id === id ? { ...line, ...patch } : line)); };
  const asked = all.filter((line) => line.quantity !== null);
  const problems = asked.filter((line) => extraMaterialProblem(line));
  const failure = raw.error ?? packaging.error ?? (notRaised(rawRequisition.error) ? undefined : rawRequisition.error)
    ?? (notRaised(packagingRequisition.error) ? undefined : packagingRequisition.error);
  const unavailable = !loaded ? null : !rawOpen && !packagingOpen ? "Raise the batch's raw material stock requisition before requesting extra material."
    : !packagingOpen ? "Packaging is not listed: raise the batch's packaging stock requisition first. Extra packaging can be requested after it."
    : !rawOpen ? "Raw material is not listed: raise the batch's raw material stock requisition first." : null;

  const columns = useMemo(() => column.columns([
    column.accessor((line) => line.material.name, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.material.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.material.code || "No code"}</div></div> }),
    column.display({ id: "kind", header: "Kind", size: 120, cell: ({ row }) => <Badge variant="outline">{row.original.kind === "raw" ? "Raw" : "Packaging"}</Badge> }),
    column.display({ id: "free", header: "Free in warehouse", size: 160, cell: ({ row }) => toLargestUnit(freeStock(row.original.material), row.original.material.unit, "calculated")?.text ?? "–" }),
    column.display({ id: "quantity", header: "Extra quantity", size: 170, cell: ({ row }) => { const problem = extraMaterialProblem(row.original); return <div className="space-y-1">
      <EditableNumberCell label={`Extra quantity of ${row.original.material.name}`} value={row.original.quantity} min={0} invalid={Boolean(problem)}
        onCommit={(value) => change(row.original.material.id, { quantity: value })} />
      {problem ? <p role="alert" className="text-xs text-destructive">{problem}</p> : null}</div>; } }),
    column.display({ id: "unit", header: "Unit", size: 130, cell: ({ row }) => { const units = relatedUnits(row.original.material.unit);
      return units.length > 1 ? <EditableSelectCell label={`Unit for ${row.original.material.name}`} value={row.original.unit} options={units.map((unit) => ({ value: unit, label: unit }))}
        onCommit={(value) => change(row.original.material.id, { unit: value })} /> : <span>{row.original.unit || "–"}</span>; } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]), []);

  const submit = async () => {
    setMessage("");
    if (asked.length === 0) { setMessage("Enter the extra quantity for at least one material."); return; }
    if (problems.length > 0) { setMessage("Fix the quantities marked in the table."); return; }
    const result = await save({ ...audit, productionScheduleProductId: batchId, body: extraMaterialRequest(all) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Extra material requested. It waits for approval.");
    setSent(true);
    void navigate(batchBoardPath(activityId));
  };

  return <div className="min-w-0 space-y-3">
    <UnsavedChangesGuard when={asked.length > 0 && !sent && !mutation.isLoading} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div role="group" aria-label="Show materials" className="flex gap-1">{kinds.map((item) =>
        <Button key={item.id} type="button" size="sm" variant={kind === item.id ? "default" : "outline"} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>{item.label}</Button>)}</div>
      <p className="text-sm text-muted-foreground">{asked.length ? `${asked.length} ${asked.length === 1 ? "material" : "materials"} to request` : "Enter a quantity beside each material that needs more."}</p>
    </div>
    <ListDataTable label="Batch materials" columns={columns} rows={shown} getRowId={(line) => line.material.id} loading={!loaded && !failure}
      error={failure ? apiErrorMessage(failure) : null} onRetry={() => { void raw.refetch(); void packaging.refetch(); void rawRequisition.refetch(); void packagingRequisition.refetch(); }} emptyTitle="This batch has no materials of this kind" />
    {unavailable ? <p className="rounded-md border bg-muted/50 p-3 text-sm">{unavailable}</p> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={() => void navigate(batchBoardPath(activityId))}>Cancel</Button>
      <Button type="button" disabled={mutation.isLoading || !loaded || (!rawOpen && !packagingOpen)} onClick={() => void submit()}>{mutation.isLoading ? <><Spinner />Sending…</> : "Request extra material"}</Button>
    </div>
  </div>;
}
