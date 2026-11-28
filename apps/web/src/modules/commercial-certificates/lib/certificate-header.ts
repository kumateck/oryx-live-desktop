import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const person = z.object({ name: z.string(), designation: text });
const people = z.array(person).nullish().transform((value) => value ?? []);

/** The facts fixed above and below an issued certificate's results. Older certificates have none. */
export const certificateHeaderSchema = z.object({
  subject: z.enum(["Product", "Material"]),
  name: text, code: text, batchNumber: text, manufacturingDate: text, expiryDate: text,
  arNumber: text, sampledAt: text, analysedAt: text,
  composition: text, packStyle: text, shelfLife: text,
  analysedBy: people, checkedBy: people, approvedBy: people,
});
export type CertificateHeader = z.infer<typeof certificateHeaderSchema>;
export type CertificatePerson = z.infer<typeof person>;

/** The header stored with the certificate, or null when it has none or it cannot be read. */
export function certificateHeader(json: string | null): CertificateHeader | null {
  if (!json) return null;
  try {
    const parsed = certificateHeaderSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}
