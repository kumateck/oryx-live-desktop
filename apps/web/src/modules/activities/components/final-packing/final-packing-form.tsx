import { useCallback, useMemo, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { useTabParam } from "@/shared/detail/tabs";
import { fromSmallestUnit, relatedUnits } from "@/shared/units/quantity";
import type { FinalPackingState } from "../../hooks/use-final-packing";
import { batchBoardPath } from "../../lib/activity-access";
import { emptyEntry, materialFigures, packCategory, varianceLimitPercent, yieldFigures, yieldTerms, type MaterialEntry } from "../../lib/final-packing";
import type { Activity } from "../../schemas/activity-schema";
import { finalPackingFormSchema, type FinalPackingFormValues } from "../../schemas/final-packing-schema";
import { MaterialsReconciliation } from "./materials-reconciliation";
import { YieldFiguresView } from "./yield-figures";
import { YieldRows } from "./yield-rows";

const number = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value : null;
const packingTabs = [{ id: "reconciliation", label: "Packing material reconciliation" }, { id: "yield", label: "Yield on packaging" }, { id: "packed", label: "Quantity packed" }] as const;

/** Records how a batch was packed: the yield, the packaging materials used, and what goes back to the warehouse. */
export function FinalPackingForm({ activity, stepId, state }: { activity: Activity; stepId: string; state: FinalPackingState }) {
  const navigate = useNavigate();
  const packing = state.source?.packing ?? null;
  const category = packCategory(packing?.unitName);
  const terms = useMemo(() => yieldTerms(category, activity.batch.unit), [category, activity.batch.unit]);
  const form = useForm<FinalPackingFormValues>({ resolver: zodResolver(finalPackingFormSchema), shouldFocusError: false, defaultValues: { qcSample: 0, retained: 0, stability: 0, reason: "" } });
  const [received, averageFilled, actualPacked, qcSample, retained, stability] = useWatch({ control: form.control, name: ["received", "averageFilled", "actualPacked", "qcSample", "retained", "stability"] });
  const inputs = useMemo(() => ({ received: number(received), averageFilled: number(averageFilled), actualPacked: number(actualPacked), qcSample: number(qcSample), retained: number(retained), stability: number(stability) }),
    [received, averageFilled, actualPacked, qcSample, retained, stability]);
  const figures = useMemo(() => yieldFigures(inputs, { category, receivedUnit: terms.receivedUnit, packingExpectedYield: packing?.expectedYield ?? 0, packsPerShipper: packing?.packsPerShipper ?? null }),
    [inputs, category, terms.receivedUnit, packing]);
  const [entries, setEntries] = useState<Record<string, MaterialEntry>>({});
  const [attempted, setAttempted] = useState(false);
  const [tab, setTab] = useTabParam(packingTabs, "reconciliation");
  const change = useCallback((materialId: string, patch: Partial<MaterialEntry>) => setEntries((current) => ({ ...current, [materialId]: { ...(current[materialId] ?? emptyEntry), ...patch } })), []);

  // The theoretical batch: for syrup, the batch's volume; otherwise the packs the packing style expects.
  const batchUnit = relatedUnits(activity.batch.unit).at(-1) ?? activity.batch.unit ?? "";
  const batchSize = category === "syrup" ? fromSmallestUnit(activity.batch.quantity, batchUnit) : packing?.expectedYield ?? 0;
  const reasonField = useMemo(() => [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for the yield variance", required: true, rows: 3,
    description: `Needed because the gain or loss is at or above ${varianceLimitPercent}%.` }] as const satisfies readonly WizardField<FinalPackingFormValues>[], []);

  const materialProblems = state.materials.filter((material) => materialFigures(material, entries[material.materialId] ?? emptyEntry).problem).length;
  const blocked = !packing ? "The batch has no packing style." : !packing.packsPerShipper ? "The batch's packing style does not say how many packs go in a shipper. Set it on the product's packing style." : null;
  const touched = form.formState.isDirty || Object.keys(entries).length > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state.saving || form.formState.isSubmitting) return;
    setAttempted(true);
    await form.handleSubmit(async (values) => {
      if (figures.afterSamples <= 0) { setTab("yield"); form.setError("actualPacked", { message: "The samples take everything that was packed" }); return; }
      if (figures.needsReason && !values.reason?.trim()) { setTab("yield"); form.setError("reason", { message: "Say why the yield is off by this much" }); return; }
      if (materialProblems > 0) { setTab("reconciliation"); return; }
      await state.save({ stepId, batchSize, inputs, figures, reason: values.reason ?? "", entries });
    }, () => setTab("yield"))();
  };

  if (state.uncertain) return <>
    <UnsavedChangesGuard when />
    <div role="alert" className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p>{state.message}</p><p>The server may have saved this request. Confirm the packing record and material return note with production or warehouse staff before submitting again.</p>
    </div>
  </>;
  if (blocked) return <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">{blocked}</p>;
  // The packing record is in; only the return of leftovers is still owed.
  if (state.pendingReturn) return <><UnsavedChangesGuard when={!state.completed} /><div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
    <p>{state.message}</p>
    <p>Keep this page open until the return is confirmed. If you leave or reload, check the packing record and return note before recording another return.</p>
    <Button type="button" size="sm" disabled={state.saving} onClick={() => void state.retryReturn()}>
      {state.saving ? <><Spinner />Returning…</> : "Return the leftovers again"}</Button>
  </div></>;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={(touched || state.saving) && !state.completed} />
    <fieldset disabled={state.saving || form.formState.isSubmitting} className="min-w-0 space-y-4">
    <section aria-label="Final packing summary" className="min-w-0 rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-base font-semibold">Final packing summary</h2>
          <p className="text-sm text-muted-foreground">Theoretical batch: {batchSize ? `${batchSize} ${category === "syrup" ? batchUnit : terms.countUnit}` : "not set"} · Pack size: {packing?.name} ({packing?.packsPerShipper} per shipper)</p></div>
      </div>
      <YieldFiguresView figures={figures} countUnit={terms.countUnit} packsPerShipper={packing?.packsPerShipper ?? null} entered={inputs.actualPacked !== null && inputs.actualPacked > 0} />
    </section>
    <Tabs value={tab} onValueChange={(value) => { const next = packingTabs.find((item) => item.id === value); if (next) void setTab(next.id); }} className="min-w-0">
      <TabsList aria-label="Final packing sections" className="grid h-auto w-full grid-cols-1 rounded-none border-b bg-transparent p-0 sm:grid-cols-3">
        <TabsTrigger value="reconciliation" className="rounded-none py-3">Packing material reconciliation</TabsTrigger>
        <TabsTrigger value="yield" className="rounded-none py-3">Yield on packaging</TabsTrigger>
        <TabsTrigger value="packed" className="rounded-none py-3">Quantity packed</TabsTrigger>
      </TabsList>
      <TabsContent value="reconciliation" className="pt-3">
        <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
          <div><h2 className="text-sm font-semibold">Packing material reconciliation</h2>
            <p className="text-xs text-muted-foreground">Enter what was packed, rejected, and sampled of each material. The rest is returned to the warehouse when you save.</p></div>
          <MaterialsReconciliation materials={state.materials} entries={entries} showProblems={attempted} disabled={state.saving} onChange={change} />
        </section>
      </TabsContent>
      <TabsContent value="yield" className="pt-3">
        <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
          <div><h2 className="text-sm font-semibold">Yield on packaging</h2><p className="text-xs text-muted-foreground">Record the amount received, fill size, samples, and actual yield.</p></div>
          <YieldRows form={form} inputs={inputs} batchSize={batchSize} batchUnit={category === "syrup" ? batchUnit : terms.countUnit} packingName={`${packing?.name ?? "Not set"} (${packing?.packsPerShipper ?? "–"} per shipper)`}
            terms={terms} figures={figures} reasonField={reasonField} />
        </section>
      </TabsContent>
      <TabsContent value="packed" className="pt-3">
        <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
          <div><h2 className="text-sm font-semibold">Quantity packed</h2><p className="text-xs text-muted-foreground">Review the actual quantity after samples and the calculated pack breakdown.</p></div>
          <YieldFiguresView figures={figures} countUnit={terms.countUnit} packsPerShipper={packing?.packsPerShipper ?? null} entered={inputs.actualPacked !== null && inputs.actualPacked > 0} />
        </section>
      </TabsContent>
    </Tabs>
    {attempted && materialProblems > 0 ? <p role="alert" className="text-sm text-destructive">{materialProblems} {materialProblems === 1 ? "material needs" : "materials need"} attention in the table above.</p> : null}
    {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={state.saving} onClick={() => void navigate(batchBoardPath(activity.id))}>Cancel</Button>
      <Button type="submit" disabled={state.saving}>{state.saving ? <><Spinner />Saving…</> : "Record final packing"}</Button>
    </div>
    </fieldset>
  </form>;
}
