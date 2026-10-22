import { z } from "zod";
export const serviceEditorSchema = z
  .object({
    name: z.string().trim().min(1).max(1000),
    code: z.string().trim().min(1).max(100),
    start: z.date().nullable(),
    end: z.date().nullable(),
    description: z.string().max(20000),
    files: z
      .array(
        z
          .instanceof(File)
          .refine((f) => f.size > 0 && f.size <= 20 * 1024 * 1024, "Each attachment must be non-empty and at most 20 MB.")
          .refine((f) => /\.(png|jpe?g|webp|pdf|doc|docx|xlsx)$/i.test(f.name), "Choose an image, PDF, Word or XLSX file."),
      )
      .max(10, "Attach at most ten files at a time."),
  })
  .superRefine((v, c) => {
    if (!v.start) c.addIssue({ code: "custom", path: ["start"], message: "Choose a start date." });
    if (!v.end || (v.start && v.end < v.start)) c.addIssue({ code: "custom", path: ["end"], message: "Choose an end date on or after the start date." });
  });
export type ServiceValues = z.infer<typeof serviceEditorSchema>;
