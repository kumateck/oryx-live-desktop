import { useCallback, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { productionApi } from "@/shared/api/generated/production";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { audit, emptyRecordLine, itemRecords, reasons, transferNoteRecords, type CountableRecord, type RecordAdjustmentFormValues } from "../adjustments";

const { useLazyGetApiV1ItemsQuery } = inventoryApi;
const { useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery } = productionApi;
type Form = UseFormReturn<RecordAdjustmentFormValues>;
type Known = Map<string, CountableRecord>;

/** Searches general-store items, or received finished goods transfer notes, and remembers what the system holds of each. */
function useRecordLoader(target: 0 | 2, known: Known): SelectLoader {
  const [loadItems] = useLazyGetApiV1ItemsQuery();
  const [loadNotes] = useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery();
  return useCallback(async (search, page, signal) => {
    const pending = target === 0 ? loadItems({ ...audit, page, pageSize: 30, searchQuery: search })
      // Only notes the finished goods store has received hold stock there.
      : loadNotes({ ...audit, page, pageSize: 30, searchQuery: search, onlyApproved: true });
    signal.addEventListener("abort", () => pending.abort(), { once: true });
    const result = await pending.unwrap();
    const records = target === 0 ? itemRecords(result.data) : transferNoteRecords(result.data);
    for (const record of records) known.set(record.value, record);
    return { options: records.map(({ value, label }) => ({ value, label })), hasPrevious: page > 1, hasNext: page < (result.pageCount ?? page) };
  }, [target, loadItems, loadNotes, known]);
}

function Line({ form, index, target, loader, known, onRemove }: { form: Form; index: number; target: 0 | 2; loader: SelectLoader; known: Known; onRemove: (() => void) | null }) {
  const [record, counted, system, unit] = useWatch({ control: form.control, name: [`lines.${index}.record`, `lines.${index}.counted`, `lines.${index}.system`, `lines.${index}.unit`] });
  // What the system holds is kept with the line, so the count can be compared when it is saved.
  const previous = useRef(record?.value);
  useEffect(() => {
    if (previous.current === record?.value) return;
    previous.current = record?.value;
    const found = record ? known.get(record.value) : undefined;
    form.setValue(`lines.${index}.system`, found?.system ?? 0);
    form.setValue(`lines.${index}.unit`, found?.unit ?? null);
  }, [record, known, form, index]);
  const difference = record && Number.isFinite(counted) ? counted - system : null;
  const fields: WizardField<RecordAdjustmentFormValues>[] = [
    { type: InputTypes.SELECT, name: `lines.${index}.record`, label: target === 0 ? "Item" : "Transfer note", mode: "single", source: "async", loadOptions: loader, required: true,
      placeholder: target === 0 ? "Search for an item" : "Search by note number or product" },
    { type: InputTypes.NUMBER, name: `lines.${index}.counted`, label: `Counted${record && unit ? ` (${unit})` : ""}`, min: 0, ...(target === 0 ? { step: 1 } : {}), required: true },
    { type: InputTypes.SELECT, name: `lines.${index}.reason`, label: "Reason", mode: "single", source: "sync", options: reasons, required: true },
    { type: InputTypes.TEXT, name: `lines.${index}.notes`, label: "Note" },
  ];
  return <li className="space-y-2 rounded-md border p-3">
    <div className="flex items-start gap-2"><FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-2 xl:grid-cols-4" />
      <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove line ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button></div>
    {record ? <p role="status" className="text-sm text-muted-foreground">The system holds <span className="font-medium text-foreground">{formatQuantityNumber(system, "calculated")} {unit ?? ""}</span>.
      {difference === null ? null : difference === 0 ? " The count agrees." : <> The count is <span className={`font-medium ${difference < 0 ? "text-destructive" : "text-foreground"}`}>{formatQuantityNumber(Math.abs(difference), "calculated")} {unit ?? ""} {difference < 0 ? "less" : "more"}</span>.</>}</p> : null}
  </li>;
}

/** What was counted, one item or one transfer note per line. */
export function RecordLines({ form, target }: { form: Form; target: 0 | 2 }) {
  const lines = useFieldArray({ control: form.control, name: "lines" });
  const known = useRef<Known>(new Map()).current;
  const loader = useRecordLoader(target, known);
  const error = form.formState.errors.lines as { message?: string; root?: { message?: string } } | undefined;
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Counted stock <span className="font-normal text-muted-foreground">({lines.fields.length})</span></h2>
      <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyRecordLine())}><Plus />Add line</Button></div>
    <ul className="space-y-2">{lines.fields.map((field, index) => <Line key={field.id} form={form} index={index} target={target} loader={loader} known={known} onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
    {error?.message ?? error?.root?.message ? <p role="alert" className="text-sm text-destructive">{error?.message ?? error?.root?.message}</p> : null}
  </section>;
}
