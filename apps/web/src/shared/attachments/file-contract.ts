import { z } from "zod";
export const attachmentMetadata = z.object({
  id: z.uuid(),
  name: z.string(),
  link: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  reference: z.string().nullish(),
});
export const attachmentFiles = z
  .array(
    z
      .instanceof(File)
      .refine((f) => f.size > 0 && f.size <= 20 * 1024 * 1024, "Each file must be non-empty and at most 20 MB.")
      .refine((f) => /\.(png|jpe?g|webp|pdf|doc|docx|xlsx)$/i.test(f.name), "Choose an image, PDF, Word or XLSX file."),
  )
  .max(10, "Attach at most ten files at a time.");
