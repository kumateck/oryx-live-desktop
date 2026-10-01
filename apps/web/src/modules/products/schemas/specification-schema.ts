import { z } from "zod";
import { earliestRevisionDate } from "../lib/specification";

const required = (message: string) => z.string({ message }).trim().min(1, message);

export const specificationFormSchema = z.object({
  specificationNumber: required("Enter the specification number"),
  revisionNumber: required("Enter the revision number"),
  supersedesNumber: required("Enter what this supersedes"),
  effectiveDate: z.date({ message: "Choose the effective date" }),
  reviewDate: z.date({ message: "Choose the revision date" }),
  form: z.object({ value: z.string().min(1, "Choose a template"), label: z.string() }, { message: "Choose a template" }),
  description: z.string().nullish(),
}).superRefine((values, context) => {
  if (values.reviewDate < earliestRevisionDate(values.effectiveDate)) {
    context.addIssue({ code: "custom", path: ["reviewDate"], message: "The revision date must be after the effective date and after today" });
  }
});
export type SpecificationFormValues = z.infer<typeof specificationFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");

/** A product's specifications, with what is needed to edit one. */
export const savedSpecificationListSchema = z.array(z.object({
  id: z.string().min(1), specificationNumber: text, revisionNumber: text, supersedesNumber: text,
  effectiveDate: z.string().nullish(), reviewDate: z.string().nullish(), dueDate: z.string().nullish(), reference: z.string().nullish(),
  description: z.string().nullish().transform((value) => value ?? ""),
  testStage: z.number().nullish().transform((value) => value ?? 0),
  form: z.object({ id: z.string().nullish(), name: text }).nullish(),
})).nullish().transform((value) => value ?? []);
export type SavedSpecification = z.infer<typeof savedSpecificationListSchema>[number];
