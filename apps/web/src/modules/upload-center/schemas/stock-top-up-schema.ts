import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month").nullable();

export const topUpLineSchema = z.object({
  materialCode: z.string().trim().min(1, "Enter the material code").max(200),
  warehouseName: z.string().trim().max(500),
  shelfName: z.string().trim().max(200),
  batchNumber: z.string().trim().min(1, "Enter the batch number").max(500),
  unitSymbol: z.string().trim().min(1, "Enter the base UOM").max(50),
  quantity: z.string().trim().refine((value) => /^\d+(\.\d+)?$/.test(value) && Number.isFinite(Number(value)) && Number(value) > 0, "Enter a quantity above zero"),
  manufactured: month,
  expiry: month,
  grn: z.string().trim().max(500),
  arNumber: z.string().trim().max(500),
}).refine((line) => !line.manufactured || !line.expiry || line.manufactured <= line.expiry,
  { path: ["expiry"], message: "Expiry cannot precede manufacturing" });

export const topUpHeaderSchema = z.object({
  department: option.nullable().refine((value): boolean => value !== null, "Choose the production department"),
  reason: z.string().trim().min(1, "Enter the reason for this top-up").max(2000),
  massUnit: option,
  volumeUnit: option,
  file: z.instanceof(File).nullable(),
});

export type TopUpLineValues = z.infer<typeof topUpLineSchema>;
export type TopUpHeaderValues = z.infer<typeof topUpHeaderSchema>;
export const emptyTopUpLine: TopUpLineValues = {
  materialCode: "", warehouseName: "", shelfName: "", batchNumber: "", unitSymbol: "",
  quantity: "", manufactured: null, expiry: null, grn: "", arNumber: "",
};
