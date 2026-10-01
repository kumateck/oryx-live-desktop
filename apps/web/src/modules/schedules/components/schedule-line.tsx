import { useEffect, useMemo, useRef, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1ProductByProductIdPackingQuery } from "../api/schedule-api";
import type { ScheduleOptions } from "../hooks/use-schedule-options";
import { audit } from "../lib/schedule-access";
import { batchQuantity, batchSizes } from "../lib/schedule-products";
import type { ScheduleFormValues } from "../schemas/schedule-schema";
import { ForecastDialog, type ForecastRequest } from "./forecast-dialog";

const none: readonly SelectOption[] = [];

/** One product on a new schedule: which product, how many batches, and how each batch is sized and packed. */
export function ScheduleLine({ form, index, options, onRemove }: { form: UseFormReturn<ScheduleFormValues>; index: number; options: ScheduleOptions; onRemove: (() => void) | null }) {
  const [product, sizeType, count, chosenPacking, market] = useWatch({ control: form.control,
    name: [`products.${index}.product`, `products.${index}.sizeType`, `products.${index}.count`, `products.${index}.packing`, `products.${index}.market`] });
  const [forecast, setForecast] = useState<ForecastRequest | null>(null);
  const productId = product?.value;
  const packing = useGetApiV1ProductByProductIdPackingQuery({ ...audit, productId: productId ?? "" }, { skip: !productId });
  const styles = packing.data;
  const styleOptions = useMemo(() => productId && styles ? styles.flatMap((style) => style.id ? [{ value: style.id, label: style.name?.trim() || "Unnamed style" }] : []) : none, [productId, styles]);

  // A packing style belongs to its product: changing the product clears it, then the new product's default is chosen.
  const previous = useRef(productId);
  useEffect(() => {
    if (previous.current !== productId) { previous.current = productId; form.setValue(`products.${index}.packing`, null); }
    if (!productId || !styles || form.getValues(`products.${index}.packing`)) return;
    const preferred = styles.find((style) => style.isDefault && style.id) ?? (styles.length === 1 ? styles[0] : undefined);
    if (preferred?.id) form.setValue(`products.${index}.packing`, { value: preferred.id, label: preferred.name?.trim() || "Unnamed style" }, { shouldValidate: true });
  }, [productId, styles, form, index]);

  const loadProducts = options.loadProducts;
  const markets = options.markets;
  const fields = useMemo((): WizardField<ScheduleFormValues>[] => [
    { type: InputTypes.SELECT, name: `products.${index}.product`, label: "Product", mode: "single", source: "async", loadOptions: loadProducts, required: true,
      placeholder: "Select a product", searchPlaceholder: "Search by name or code", className: "xl:col-span-2" },
    { type: InputTypes.NUMBER, name: `products.${index}.count`, label: "Batches", required: true, min: 1, step: 1 },
    { type: InputTypes.SELECT, name: `products.${index}.sizeType`, label: "Batch size", mode: "single", source: "sync", options: batchSizes, required: true },
    { type: InputTypes.SELECT, name: `products.${index}.packing`, label: "Packing style", mode: "single", source: "sync", options: styleOptions, required: true,
      placeholder: !productId ? "Choose a product first" : packing.isFetching ? "Loading…" : styleOptions.length ? "Select a packing style" : "This product has no packing styles" },
    { type: InputTypes.SELECT, name: `products.${index}.market`, label: "Market type", mode: "single", source: "sync", options: markets, placeholder: "None" },
  ], [index, loadProducts, markets, styleOptions, productId, packing.isFetching]);

  const facts = options.facts(productId);
  const quantity = batchQuantity(facts, sizeType?.value);
  const batches = typeof count === "number" && Number.isInteger(count) && count > 0 ? count : null;
  // The forecast needs to know what is being made and how much of it.
  const forecastBlocked = !product ? "Choose a product to see its forecast" : !chosenPacking ? "Choose a packing style to see the forecast" : !batches ? "Enter the number of batches to see the forecast" : "";
  return <li className="space-y-2 rounded-md border p-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-medium">Product {index + 1}</span>
      <span className="flex items-center gap-2">
        {forecastBlocked ? <span className="text-xs text-muted-foreground">{forecastBlocked}</span> : null}
        <Button type="button" size="sm" variant="outline" disabled={Boolean(forecastBlocked)} aria-label={`Material forecast for product ${index + 1}`}
          onClick={() => { if (product && chosenPacking && batches) setForecast({ product, packing: chosenPacking, sizeType, count: batches, market: market?.label ?? null }); }}><TrendingUp />Forecast</Button>
        {onRemove ? <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove product ${index + 1}`} onClick={onRemove}><Trash2 /></Button> : null}
      </span>
    </div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-2 xl:grid-cols-6" />
    {productId ? <p className="text-xs text-muted-foreground">{quantity === null
      ? <span className="text-destructive">This product has no full batch size, so it cannot be scheduled. Set it on the product first.</span>
      : <>Each batch: {toLargestUnit(quantity, facts?.unit, "calculated")?.text ?? quantity}{batches && batches > 1 ? ` · ${batches} batches: ${toLargestUnit(quantity * batches, facts?.unit, "calculated")?.text ?? quantity * batches}` : ""}</>}</p> : null}
    {forecast ? <ForecastDialog request={forecast} onClose={() => setForecast(null)} /> : null}
  </li>;
}
