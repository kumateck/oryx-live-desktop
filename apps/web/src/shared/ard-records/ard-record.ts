import { z } from "zod";
import { api } from "@/shared/api/base-api";
import type { DomainEntitiesQualityRoutinesCommercialCoaItemRequest as CoaItem } from "@/shared/api/generated/analytical";

export const ardAudit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;
export const ardAttachmentTypes = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlsx";

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const named = z.object({ id: z.string().nullish(), name: text, code: text }).nullish().transform((value) => value?.id ? { id: value.id, name: value.name ?? "Unnamed", code: value.code } : null);
const stp = z.object({ id: z.string().nullish(), stpNumber: text, material: named, product: named }).nullish()
  .transform((value) => value?.id ? { id: value.id, number: value.stpNumber, item: value.material ?? value.product ?? null } : null);

/**
 * A material or product analytical raw data record: the template its tests are recorded on, linked to the item's STP and
 * specification. The server overwrites every field on update, so what the pages do not edit is kept to be sent back.
 */
export const ardRecordSchema = z.object({
  id: z.string(), specNumber: text, description: text, createdAt: text, isVerified: z.boolean().nullish().transform((value) => value === true),
  stage: z.number().nullish().transform((value) => value ?? null),
  analysisType: z.number().nullish().transform((value): 0 | 1 | null => value === 0 || value === 1 ? value : null),
  coaItems: z.custom<CoaItem[]>((value) => Array.isArray(value)).nullish().transform((value) => value ?? null),
  uniformityOfWeight: z.object({ id: z.string().nullish() }).nullish().transform((value) => value?.id ?? null),
  form: z.object({ id: z.string().nullish(), name: text }).nullish().transform((value) => value?.id ? { id: value.id, name: value.name ?? "Unnamed template" } : null),
  materialStandardTestProcedure: stp, productStandardTestProcedure: stp,
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish()
    .transform((value) => (value ?? []).map((file, index) => ({ id: file.id ?? `file-${String(index)}`, name: file.name ?? "Attachment", link: file.link }))),
}).transform(({ materialStandardTestProcedure, productStandardTestProcedure, ...rest }) => {
  const procedure = materialStandardTestProcedure ?? productStandardTestProcedure ?? null;
  return { ...rest, stp: procedure, item: procedure?.item ?? null };
});
export type ArdRecord = z.infer<typeof ardRecordSchema>;
export const ardRowsSchema = z.array(ardRecordSchema);

/** What an update sends back unchanged: the analysis type, certificate items and uniformity of weight link. */
export function keptFields(record: ArdRecord) {
  return {
    ...(record.analysisType !== null ? { analysisType: record.analysisType } : {}),
    ...(record.coaItems ? { coaItems: record.coaItems } : {}),
    ...(record.uniformityOfWeight ? { uniformityOfWeightId: record.uniformityOfWeight } : {}),
  };
}

/** Attaching files is multipart; the generated endpoint would send its body as JSON. */
export const ardFilesApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadArdFiles: build.mutation<void, { modelType: "MaterialAnalyticalRawData" | "ProductAnalyticalRawData"; modelId: string; files: readonly File[] }>({
    query: ({ modelType, modelId, files }) => {
      const body = new FormData();
      for (const file of files) body.append("files", file, file.name);
      return { url: `/api/v1/file/${modelType}/${modelId}`, method: "POST", body, headers: { Module: "General", SubModule: "File Upload" } };
    },
  }),
}) });
