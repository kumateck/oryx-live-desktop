import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { batchQuantity, batchSizes, type ScheduleLine } from "../lib/schedule-products";
import { scheduleLinesFormSchema, type ScheduleLineValues, type ScheduleLinesFormValues } from "../schemas/schedule-schema";
import { useScheduleOptions } from "./use-schedule-options";

const emptyLine = (): ScheduleLineValues => ({ product: null, packing: null, sizeType: batchSizes[0], market: null, count: 1 });

/**
 * The product lines of a schedule, as their own form: used when creating a schedule and when
 * adding products to one. `read` validates the lines and returns what to send, or null when
 * something is missing (the messages are then on the fields).
 */
export function useScheduleLines() {
  const options = useScheduleOptions();
  const form = useForm<ScheduleLinesFormValues>({ resolver: zodResolver(scheduleLinesFormSchema), defaultValues: { products: [emptyLine()] } });
  const fields = useFieldArray({ control: form.control, name: "products" });

  const read = async (): Promise<ScheduleLine[] | null> => {
    let lines: ScheduleLine[] | null = null;
    await form.handleSubmit((values) => {
      const next: ScheduleLine[] = [];
      for (const [index, item] of values.products.entries()) {
        if (!item.product || !item.packing) return;
        const quantity = batchQuantity(options.facts(item.product.value), item.sizeType.value);
        if (quantity === null) { form.setError(`products.${index}.product`, { message: "This product has no full batch size" }); return; }
        next.push({ productId: item.product.value, packingId: item.packing.value, sizeType: item.sizeType.value, marketTypeId: item.market?.value ?? null, count: item.count, quantity });
      }
      lines = next;
    })();
    return lines;
  };

  return { form, options, fields, read, add: () => fields.append(emptyLine()), dirty: form.formState.isDirty };
}
export type ScheduleLinesState = ReturnType<typeof useScheduleLines>;
