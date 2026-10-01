import { z } from "zod";

/** True when rich text holds nothing a reader would see: no text and no image, whatever empty tags remain. */
export function richTextEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  if (/<img\b/i.test(html)) return false;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

const pack = (name: string) => z.string({ message: `Describe the ${name} pack` }).refine((value) => !richTextEmpty(value), `Describe the ${name} pack`);

export const packingOrderFormSchema = z.object({
  primaryPackDescription: pack("primary"),
  secondaryPackDescription: pack("secondary"),
  tertiaryPackDescription: pack("tertiary"),
});
export type PackingOrderFormValues = z.infer<typeof packingOrderFormSchema>;

const saved = z.string().nullish().transform((value) => value ?? "");
/** The packing instructions on a saved product. */
export const packingOrderSourceSchema = z.object({ primaryPackDescription: saved, secondaryPackDescription: saved, tertiaryPackDescription: saved });
