import { useEffect, useMemo, useRef } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { materialsApi } from "@/shared/api/generated/materials";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useMaterialOptions } from "@/shared/reference-data/use-material-options";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { audit, countUnit, emptyLine, reasons, shelfStockSchema, systemInCountUnit, type AdjustmentFormValues } from "../adjustments";

const { useGetApiV1MaterialByMaterialIdShelfQuery } = materialsApi;
type Form = UseFormReturn<AdjustmentFormValues>;

function Line({ form, index, kind, onRemove }: { form: Form; index: number; kind: MaterialKind; onRemove: (() => void) | null }) {
  const user = useCurrentUser();
  const loadMaterials = useMaterialOptions(kind);
  const [material, stock, counted] = useWatch({ control: form.control, name: [`lines.${index}.material`, `lines.${index}.stock`, `lines.${index}.counted`] });
  // What the user's own department holds of the material, shelf by shelf.
  const shelves = useGetApiV1MaterialByMaterialIdShelfQuery(material && user?.departmentId ? { ...audit, materialId: material.value, departmentId: user.departmentId } : skipToken);
  const stocks = useMemo(() => { const parsed = shelfStockSchema.safeParse(shelves.data ?? null); return parsed.success ? parsed.data : []; }, [shelves.data]);
  // A batch and shelf belong to one material; choosing another material clears them.
  const previous = useRef(material?.value);
  useEffect(() => { if (previous.current !== material?.value) { previous.current = material?.value; form.setValue(`lines.${index}.stock`, null); form.setValue(`lines.${index}.system`, 0); form.setValue(`lines.${index}.unit`, null); } }, [material?.value, form, index]);
  const picked = stocks.find((item) => item.id === stock?.value) ?? null;
  // What the system holds is kept with the line, so the count can be compared and converted when it is saved.
  useEffect(() => { if (picked) { form.setValue(`lines.${index}.system`, picked.quantity); form.setValue(`lines.${index}.unit`, picked.unit); } }, [picked, form, index]);
  const unit = picked ? countUnit(picked.unit) : "";
  const system = picked ? systemInCountUnit(picked) : null;
  const difference = picked && Number.isFinite(counted) ? counted - (system ?? 0) : null;
  const fields: WizardField<AdjustmentFormValues>[] = [
    { type: InputTypes.SELECT, name: `lines.${index}.material`, label: "Material", mode: "single", source: "async", loadOptions: loadMaterials, required: true, placeholder: "Search for a material" },
    { type: InputTypes.SELECT, name: `lines.${index}.stock`, label: "Batch and shelf", mode: "single", source: "sync", required: true, disabled: !material,
      options: stocks.map((item) => ({ value: item.id, label: `${item.batchNumber ?? "No batch number"} · ${item.shelf}` })),
      placeholder: !material ? "Choose the material first" : shelves.isFetching ? "Loading…" : stocks.length ? "Select what was counted" : "Your store holds none of this material" },
    { type: InputTypes.NUMBER, name: `lines.${index}.counted`, label: `Counted${unit ? ` (${unit})` : ""}`, min: 0, required: true },
    { type: InputTypes.SELECT, name: `lines.${index}.reason`, label: "Reason", mode: "single", source: "sync", options: reasons, required: true },
    { type: InputTypes.TEXT, name: `lines.${index}.notes`, label: "Note", className: "md:col-span-2" },
  ];
  return <li className="space-y-2 rounded-md border p-3">
    <div className="flex items-start gap-2"><FormWizard form={form} fields={fields} className="min-w-0 flex-1 md:grid-cols-2 xl:grid-cols-4" />
      <Button type="button" size="icon-sm" variant="ghost" className="mt-6" aria-label={`Remove line ${index + 1}`} disabled={!onRemove} onClick={() => onRemove?.()}><Trash2 /></Button></div>
    {shelves.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(shelves.error)}</p> : null}
    {picked ? <p role="status" className="text-sm text-muted-foreground">The system holds <span className="font-medium text-foreground">{formatQuantityNumber(system ?? 0, "calculated")} {unit}</span> there.
      {difference === null ? null : difference === 0 ? " The count agrees." : <> The count is <span className={`font-medium ${difference < 0 ? "text-destructive" : "text-foreground"}`}>{formatQuantityNumber(Math.abs(difference), "calculated")} {unit} {difference < 0 ? "less" : "more"}</span>.</>}</p> : null}
  </li>;
}

/** What was counted, line by line: one batch on one shelf each. Changing the material of a line clears what was chosen under it. */
export function AdjustmentLines({ form, kind }: { form: Form; kind: MaterialKind }) {
  const lines = useFieldArray({ control: form.control, name: "lines" });
  const error = form.formState.errors.lines as { message?: string; root?: { message?: string } } | undefined;
  return <section className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Counted stock <span className="font-normal text-muted-foreground">({lines.fields.length})</span></h2>
      <Button type="button" size="sm" variant="outline" onClick={() => lines.append(emptyLine())}><Plus />Add line</Button></div>
    <ul className="space-y-2">{lines.fields.map((field, index) => <Line key={field.id} form={form} index={index} kind={kind} onRemove={lines.fields.length > 1 ? () => lines.remove(index) : null} />)}</ul>
    {error?.message ?? error?.root?.message ? <p role="alert" className="text-sm text-destructive">{error?.message ?? error?.root?.message}</p> : null}
  </section>;
}
