import { z } from "zod";
export const signatureLimit = 2 * 1024 * 1024;
export const signatureProfileSchema = z.object({ id: z.string().min(1), signature: z.string().nullable() });
export const signatureSchema = z.object({ mode: z.enum(["draw", "type", "upload"]), drawing: z.string().nullable(), name: z.string().max(80), image: z.instanceof(File).nullable() })
  .superRefine((values, context) => {
    if (values.mode === "draw" && !values.drawing?.startsWith("data:image/png;base64,")) context.addIssue({ code: "custom", path: ["drawing"], message: "Draw your signature" });
    if (values.mode === "type" && !values.name.trim()) context.addIssue({ code: "custom", path: ["name"], message: "Enter your signature name" });
    if (values.mode === "upload" && (!values.image || !["image/png", "image/jpeg", "image/webp"].includes(values.image.type) || values.image.size > signatureLimit || !values.image.size)) {
      context.addIssue({ code: "custom", path: ["image"], message: "Choose a PNG, JPEG, or WebP image up to 2 MiB" });
    }
  });
export type SignatureValues = z.infer<typeof signatureSchema>;
export const emptySignature: SignatureValues = { mode: "draw", drawing: null, name: "", image: null };
