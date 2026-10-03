import { useCallback, useMemo, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { fromSmallestUnit, relatedUnits } from "@/shared/units/quantity";
import type { FinalPackingState } from "../../hooks/use-final-packing";
import { batchBoardPath } from "../../lib/activity-access";
import { emptyEntry, materialFigures, packCategory, varianceLimitPercent, yieldFigures, yieldTerms, type MaterialEntry } from "../../lib/final-packing";
import type { Activity } from "../../schemas/activity-schema";
import { finalPackingFormSchema, type FinalPackingFormValues } from "../../schemas/final-packing-schema";
import { MaterialsReconciliation } from "./materials-reconciliation";
import { YieldFiguresView } from "./yield-figures";

const number = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value : null;

/** Records how a batch was packed: the yield, the packaging materials used, and what goes back to the warehouse. */
export function FinalPackingForm({ activity, stepId, state }: { activity: Activity; stepId: string; state: FinalPackingState }) {
  const navigate = useNavigate();
  const packing = state.source?.packing ?? null;
  const category = packCategory(packing?.unitName);
  const terms = useMemo(() => yieldTerms(category, activity.batch.unit), [category, activity.batch.unit]);
  const form = useForm<FinalPackingFormValues>({ resolver: zodResolver(finalPackingFormSchema), defaultValues: { qcSample: 0, retained: 0, stability: 0, reason: "" } });
  const [received, averageFilled, actualPacked, qcSample, retained, stability] = useWatch({ control: form.control, name: ["received", "averageFilled", "actualPacked", "qcSample", "retained", "stability"] });
  const inputs = useMemo(() => ({ received: number(received), averageFilled: number(averageFilled), actualPacked: number(actualPacked), qcSample: number(qcSample), retained: number(retained), stability: number(stability) }),
    [received, averageFilled, actualPacked, qcSample, retained, stability]);
  const figures = useMemo(() => yieldFigures(inputs, { category, receivedUnit: terms.receivedUnit, packingExpectedYield: packing?.expectedYield ?? 0, packsPerShipper: packing?.packsPerShipper ?? null }),
    [inputs, category, terms.receivedUnit, packing]);
  const [entries, setEntries] = useState<Record<string, MaterialEntry>>({});
  const [attempted, setAttempted] = useState(false);
  const [done, setDone] = useState(false);
  const change = useCallback((materialId: string, patch: Partial<MaterialEntry>) => setEntries((current) => ({ ...current, [materialId]: { ...(current[materialId] ?? emptyEntry), ...patch } })), []);

  // The theoretical batch: for syrup, the batch's volume; otherwise the packs the packing style expects.
  const batchUnit = relatedUnits(activity.batch.unit).at(-1) ?? activity.batch.unit ?? "";
  const batchSize = category === "syrup" ? fromSmallestUnit(activity.batch.quantity, batchUnit) : packing?.expectedYield ?? 0;
  const fields = useMemo(() => [
    { type: InputTypes.NUMBER, name: "received", label: `${terms.receivedLabel} (${terms.receivedUnit})`, required: true, min: 0 },
    { type: InputTypes.NUMBER, name: "averageFilled", label: `${terms.averageLabel} (${terms.averageUnit})`, required: true, min: 0 },
    { type: InputTypes.NUMBER, name: "actualPacked", label: `Actual quantity packed (${terms.countUnit})`, required: true, min: 0 },
    { type: InputTypes.NUMBER, name: "qcSample", label: "Quality control analytical sample", min: 0 },
    { type: InputTypes.NUMBER, name: "retained", label: "Retained sample", min: 0 },
    { type: InputTypes.NUMBER, name: "stability", label: "Stability or registration sample", min: 0 },
  ] as const satisfies readonly WizardField<FinalPackingFormValues>[], [terms]);
  const reasonField = useMemo(() => [{ type: InputTypes.TEXTAREA, name: "reason", label: "Reason for the yield variance", required: true, rows: 3,
    description: `Needed because the gain or loss is at or above ${varianceLimitPercent}%.` }] as const satisfies readonly WizardField<FinalPackingFormValues>[], []);

  const materialProblems = state.materials.filter((material) => materialFigures(material, entries[material.materialId] ?? emptyEntry).problem).length;
  const blocked = !packing ? "The batch has no packing style." : !packing.packsPerShipper ? "The batch's packing style does not say how many packs go in a shipper. Set it on the product's packing style." : null;
  const touched = form.formState.isDirty || Object.keys(entries).length > 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    await form.handleSubmit(async (values) => {
      if (figures.afterSamples <= 0) { form.setError("actualPacked", { message: "The samples take everything that was packed" }); return; }
      if (figures.needsReason && !values.reason?.trim()) { form.setError("reason", { message: "Say why the yield is off by this much" }); return; }
      if (materialProblems > 0) return;
      const saved = await state.save({ stepId, batchSize, inputs, figures, reason: values.reason ?? "", entries });
      if (saved) { setDone(true); void navigate(batchBoardPath(activity.id)); }
    })();
  };

  if (blocked) return <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">{blocked}</p>;
  // The packing record is in; only the return of leftovers is still owed.
  if (state.pendingReturn) return <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
    <p>{state.message}</p>
    <Button type="button" size="sm" disabled={state.saving} onClick={() => void state.retryReturn().then((ok) => { if (ok) { setDone(true); void navigate(batchBoardPath(activity.id)); } })}>
      {state.saving ? <><Spinner />Returning…</> : "Return the leftovers again"}</Button>
  </div>;

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={touched && !done && !state.saving} />
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
      <div><h2 className="text-sm font-semibold">Yield on packaging</h2>
        <p className="text-xs text-muted-foreground">Theoretical batch: {batchSize ? `${batchSize} ${category === "syrup" ? batchUnit : terms.countUnit}` : "not set"} · Pack size: {packing?.name} ({packing?.packsPerShipper} per shipper)</p></div>
      <FormWizard form={form} fields={fields} className="md:grid-cols-2 xl:grid-cols-3" />
      <YieldFiguresView figures={figures} countUnit={terms.countUnit} packsPerShipper={packing?.packsPerShipper ?? null} entered={inputs.actualPacked !== null && inputs.actualPacked > 0} />
      {figures.needsReason ? <FormWizard form={form} fields={reasonField} /> : null}
    </section>
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
      <div><h2 className="text-sm font-semibold">Packing material reconciliation</h2>
        <p className="text-xs text-muted-foreground">Enter what was packed, rejected, and sampled of each material. The rest is returned to the warehouse when you save.</p></div>
      <MaterialsReconciliation materials={state.materials} entries={entries} showProblems={attempted} disabled={state.saving} onChange={change} />
    </section>
    {attempted && materialProblems > 0 ? <p role="alert" className="text-sm text-destructive">{materialProblems} {materialProblems === 1 ? "material needs" : "materials need"} attention in the table above.</p> : null}
    {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={state.saving} onClick={() => void navigate(batchBoardPath(activity.id))}>Cancel</Button>
      <Button type="submit" disabled={state.saving}>{state.saving ? <><Spinner />Saving…</> : "Record final packing"}</Button>
    </div>
  </form>;
}
