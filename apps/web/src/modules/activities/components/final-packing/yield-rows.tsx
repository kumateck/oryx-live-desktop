import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { YieldFigures, YieldInputs, yieldTerms } from "../../lib/final-packing";
import type { FinalPackingFormValues } from "../../schemas/final-packing-schema";

type CountField = keyof YieldInputs;
type YieldRow = { label: string; value: string } | { label: string; field: CountField; unit: string; required?: boolean };
const count = (value: number) => formatQuantityNumber(value, "calculated");

/** Editable yield measurements and read-only results in the batch record's row order. */
export function YieldRows({ form, inputs, batchSize, batchUnit, packingName, terms, figures, preloadedAverage, reasonField }: {
  form: UseFormReturn<FinalPackingFormValues>;
  inputs: YieldInputs;
  batchSize: number;
  batchUnit: string;
  packingName: string;
  terms: ReturnType<typeof yieldTerms>;
  figures: YieldFigures;
  preloadedAverage: boolean;
  reasonField: readonly WizardField<FinalPackingFormValues>[];
}) {
  const quantity = (value: number) => `${count(value)} ${terms.countUnit}`;
  const entered = inputs.actualPacked !== null && inputs.actualPacked > 0;
  const rows: YieldRow[] = [
    { label: "Batch size (theoretical yield of batch)", value: `${count(batchSize)} ${batchUnit}` },
    ...(terms.requiresReceived ? [{ label: terms.receivedLabel, field: "received" as const, unit: terms.receivedUnit, required: true }] : []),
    ...(preloadedAverage ? [{ label: terms.averageLabel, value: `${formatQuantityNumber(inputs.averageFilled ?? 0, "entered")} ${terms.averageUnit}` }]
      : [{ label: terms.averageLabel, field: "averageFilled" as const, unit: terms.averageUnit, required: true }]),
    { label: "Pack size", value: packingName },
    { label: "Expected yield", value: figures.expected > 0 ? quantity(figures.expected) : "–" },
    { label: "Total quantity packed (including samples)", field: "actualPacked", unit: terms.countUnit, required: true },
    { label: "Quality control analytical sample", field: "qcSample", unit: terms.countUnit },
    { label: "Retained sample", field: "retained", unit: terms.countUnit },
    { label: "Stability/Registration sample", field: "stability", unit: terms.countUnit },
    { label: "Available for warehouse transfer", value: entered ? quantity(figures.afterSamples) : "–" },
    { label: "Total gain or loss on packed", value: entered && figures.expected > 0 ? `${figures.gainOrLoss > 0 ? "+" : ""}${quantity(figures.gainOrLoss)}` : "–" },
    { label: "Percentage gain or loss", value: figures.percent === null ? "–" : `${figures.percent > 0 ? "+" : ""}${count(figures.percent)}%` },
  ];
  return <div className="min-w-0">
    <table aria-label="Yield on packaging" className="w-full table-fixed border-separate border-spacing-0 text-sm">
      <thead><tr className="bg-primary text-primary-foreground">
        <th scope="col" className="w-[12%] p-3 text-left font-semibold">SR Number</th>
        <th scope="col" className="w-[40%] p-3 text-left font-semibold">Particulars</th>
        <th scope="col" className="p-3 text-left font-semibold">Results/Records</th>
      </tr></thead>
      <tbody>{rows.map((row, index) => <tr key={row.label} className="[&>td]:border-b [&>td]:border-border/60">
        <td className="p-3 align-middle">{index + 1}</td>
        <td className="break-words p-3 align-middle">{row.label}{"required" in row && row.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</td>
        <td className="p-3 align-middle">{"field" in row ? <Controller control={form.control} name={row.field} render={({ field, fieldState }) => <>
          <div className="flex min-w-0 items-center gap-2">
            <Input {...field} type="number" min={0} step={row.field === "received" || row.field === "averageFilled" ? "any" : 1} placeholder="Enter number"
              value={Number.isFinite(field.value) ? field.value : ""} aria-label={row.label} aria-required={row.required} aria-invalid={Boolean(fieldState.error)}
              aria-describedby={fieldState.error ? `packing-${row.field}-error` : undefined}
              onChange={(event) => field.onChange(event.target.valueAsNumber)} />
            <span className="shrink-0 text-xs text-muted-foreground">{row.unit}</span>
          </div>
          {fieldState.error ? <p role="alert" id={`packing-${row.field}-error`} className="mt-1 text-xs text-destructive">{fieldState.error.message}</p> : null}
        </>} /> : <span className="break-words font-medium">{row.value}</span>}</td>
      </tr>)}</tbody>
    </table>
    {figures.needsReason ? <div className="mt-4"><FormWizard form={form} fields={reasonField} /></div> : null}
  </div>;
}
