import { z } from "zod";
import { batchRowsSchema } from "@/modules/receiving-area/schemas/receiving-schema";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const grn = z.object({ id: z.string().nullish(), grnNumber: text, createdAt: z.string().nullish(), carrierName: text, vehicleNumber: text, remarks: text, declarationNumber: text, status: z.number().nullish(), materialBatches: batchRowsSchema });

function read(entry: z.infer<typeof grn>) {
  if (!entry.id) return null;
  return { id: entry.id, number: entry.grnNumber ?? "No number", createdAt: entry.createdAt ?? null, carrier: entry.carrierName, vehicle: entry.vehicleNumber, remarks: entry.remarks, declaration: entry.declarationNumber,
    status: entry.status ?? null, batches: entry.materialBatches };
}
/** A goods received note: the delivery it records and the batches it put into quarantine. */
export const grnSchema = grn.transform(read);
export const grnRowsSchema = z.array(grn).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Grn = z.infer<typeof grnRowsSchema>[number];
