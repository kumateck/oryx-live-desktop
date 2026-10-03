import { z } from "zod";

export const atrFormSchema = z.object({
  state: z.object({ value: z.string().min(1, "Choose the product state"), label: z.string() }, { message: "Choose the product state" }),
  filled: z.string({ message: "Enter the filled volume" }).trim().min(1, "Enter the filled volume"),
});
export type AtrFormValues = z.infer<typeof atrFormSchema>;
