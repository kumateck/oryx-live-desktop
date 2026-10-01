import { z } from "zod";
import type { DomainEntitiesQualityRoutinesCommercialCoaItemRequest } from "@/shared/api/generated/analytical";

export const ardAttachmentTypes = ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlsx";

export const ardFormSchema = z.object({
  specNumber: z.string({ message: "Enter the specification number" }).trim().min(1, "Enter the specification number"),
  description: z.string().trim().nullish(),
  attachments: z.array(z.instanceof(File)).optional(),
});
export type ArdFormValues = z.infer<typeof ardFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const ref = z.object({ id: z.string().nullish(), name: text }).nullish();

/** A product's analytical raw data records, with everything needed to save one back unchanged. */
export const savedArdListSchema = z.array(z.object({
  id: z.string().min(1), specNumber: text, description: text,
  stage: z.number().nullish().transform((value) => value ?? 0),
  analysisType: z.number().nullish(),
  coaItems: z.custom<DomainEntitiesQualityRoutinesCommercialCoaItemRequest[]>((value) => Array.isArray(value)).nullish(),
  form: ref,
  productStandardTestProcedure: z.object({ id: z.string().nullish(), stpNumber: text }).nullish(),
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: z.string().nullish() })).nullish().transform((value) => value ?? []),
})).nullish().transform((value) => value ?? []);
export type SavedArd = z.infer<typeof savedArdListSchema>[number];

/** The parts of a product's specifications an ARD is created from. */
export const ardSpecificationSourceSchema = z.array(z.object({ testStage: z.number().nullish(), specificationNumber: text, form: ref })).nullish().transform((value) => value ?? []);
export type ArdSpecificationSource = z.infer<typeof ardSpecificationSourceSchema>;
export const ardStpSourceSchema = z.object({ id: z.string().min(1), stpNumber: text });
