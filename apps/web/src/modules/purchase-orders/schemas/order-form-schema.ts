import { z } from "zod";
import type { SupplierType } from "@/shared/procurement/supplier-type";

// A number field left empty reports "not a number", so that is accepted here and judged below with the rest.
const amount = z.number().or(z.nan()).nullish();
const given = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value);

/**
 * The charges added to an order's lines. A foreign order is not complete without what it costs to insure
 * and ship; tax on a local order is optional, and never negative.
 */
export function chargesSchema(type: SupplierType) {
  return z.object({ insurance: amount, freight: amount, tax: amount }).superRefine((values, context) => {
    if (type === 1) {
      if (given(values.tax) && values.tax < 0) context.addIssue({ code: "custom", path: ["tax"], message: "Tax cannot be negative" });
      return;
    }
    for (const name of ["insurance", "freight"] as const) {
      const value = values[name];
      if (!given(value)) context.addIssue({ code: "custom", path: [name], message: `Enter the ${name}` });
      else if (value <= 0) context.addIssue({ code: "custom", path: [name], message: `The ${name} must be above zero` });
    }
  });
}
export type ChargesValues = z.infer<ReturnType<typeof chargesSchema>>;

export const sendOrderSchema = z.object({ expectedDelivery: z.date({ message: "Choose when delivery is expected" }) });
export type SendOrderValues = z.infer<typeof sendOrderSchema>;
