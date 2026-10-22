import { z } from "zod";
const date = z.string().refine((v) => Number.isFinite(Date.parse(v)), "Invalid service date.");
import { attachmentMetadata } from "@/shared/attachments/file-contract";
export const serviceAttachmentSchema = attachmentMetadata;
export const serviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string().nullish(),
  startDate: date,
  endDate: date,
  isActive: z.boolean(),
  description: z.string().nullish(),
  attachments: z
    .array(serviceAttachmentSchema)
    .nullish()
    .transform((v) => v ?? [])
    .refine((rows) => new Set(rows.map((r) => r.id)).size === rows.length, "Repeated service attachment identity."),
  createdAt: date.nullish(),
});
export type StoreService = z.infer<typeof serviceSchema>;
export const servicesAudit = { module: "Services", subModule: "Service Management" };
