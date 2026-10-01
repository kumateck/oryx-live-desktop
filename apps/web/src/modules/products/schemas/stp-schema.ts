import { z } from "zod";

export const stpFormSchema = z.object({
  stpNumber: z.string({ message: "Enter the STP number" }).trim().min(1, "Enter the STP number"),
  description: z.string().nullish(),
  document: z.instanceof(File).nullish().refine((file) => !file || file.name.toLowerCase().endsWith(".docx"), "Choose a .docx file"),
  reasonForChange: z.string().trim().nullish(),
});
export type StpFormValues = z.infer<typeof stpFormSchema>;

/** A product's saved STP. */
export const savedStpSchema = z.object({
  id: z.string().min(1),
  stpNumber: z.string().nullish().transform((value) => value?.trim() ?? ""),
  description: z.string().nullish().transform((value) => value ?? ""),
});
export type SavedStp = z.infer<typeof savedStpSchema>;

/** The controlled document attached to an STP; the endpoint answers with nothing when there is none yet. */
export const stpDocumentSchema = z.object({
  id: z.string().min(1),
  status: z.number().nullish().transform((value) => value ?? 0),
  versions: z.array(z.object({
    versionNumber: z.number().nullish(), fileName: z.string().nullish(), isEffective: z.boolean().nullish(), isSuperseded: z.boolean().nullish(),
    createdByName: z.string().nullish(), createdAt: z.string().nullish(),
  })).nullish().transform((value) => value ?? []),
}).nullish().transform((value) => value ?? null);
export type StpDocument = NonNullable<z.infer<typeof stpDocumentSchema>>;
