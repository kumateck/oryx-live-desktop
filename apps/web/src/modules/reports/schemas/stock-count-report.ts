import { z } from "zod";
const text = z.string().trim().nullish();
export const stockCountReportSchema = z.object({
  generatedAt: z.iso.datetime({ offset: true }), departmentId: z.uuid().nullish(), departmentName: text,
  materialKind: z.union([z.literal(0), z.literal(1)]).nullish(), expiredOnly: z.boolean(),
  rows: z.array(z.object({
    batchId: z.uuid(), departmentId: z.uuid().nullish(), departmentName: text, uoMId: z.uuid(),
    materialName: text, materialCode: text, batchNumber: text, arNumber: text,
    manufacturerName: text, supplierName: text, manufacturingDate: text, expiryDate: text, retestDate: text,
    quantity: z.number().finite().positive(), uoM: z.string().trim().min(1),
  })),
});
export type StockCountReport = z.infer<typeof stockCountReportSchema>;
