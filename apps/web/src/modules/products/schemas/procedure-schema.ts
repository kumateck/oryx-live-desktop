import { z } from "zod";
import { mainActions } from "../lib/procedure-actions";

const option = z.object({ value: z.string().min(1), label: z.string() });

const party = z.object({
  kind: z.enum(["user", "role"]),
  // Empty until chosen. Checked here, not in the step's cross-field check, so the message shows with the step's other messages.
  who: option.nullable().refine((value): boolean => Boolean(value), "Choose who is responsible"),
  action: option.nullable().refine((value): boolean => Boolean(value), "Choose an instruction"),
  ard: option.nullish(),
});

export const procedureStepFormSchema = z.object({
  operation: z.object({ value: z.string().min(1, "Choose an operation"), label: z.string() }, { message: "Choose an operation" }),
  workCenters: z.array(option, { message: "Choose at least one work center" }).min(1, "Choose at least one work center"),
  estimatedTime: z.string().nullish(),
  isCritical: z.boolean().optional(),
  parties: z.array(party).min(1, "Add at least one responsible user or role"),
}).superRefine((step, context) => {
  const seen = new Set<string>();
  step.parties.forEach((item, index) => {
    if (!item.who || !item.action) return;
    const key = `${item.kind}:${item.who.value}:${item.action.value}`;
    if (seen.has(key)) context.addIssue({ code: "custom", path: ["parties", index, "who"], message: "Already assigned this instruction" });
    seen.add(key);
  });
  // An automated step moves to "in progress" by itself and stops; nobody can complete a main action on it.
  if (!step.isCritical && step.parties.some((item) => item.action && mainActions.includes(item.action.value))) {
    context.addIssue({ code: "custom", path: ["isCritical"],
      message: "An automated step cannot carry a main instruction (requisition, final packing, transfer, dispatch, ATR), because it could never be completed. Mark the step critical or choose another instruction." });
  }
});
export type ProcedureStepFormValues = z.infer<typeof procedureStepFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const item = z.object({ id: z.string().nullish(), name: text }).nullish();
const responsible = z.object({
  user: item, role: item, action: z.number().nullish(),
  productAnalyticalRawData: z.object({ id: z.string().nullish(), stage: z.number().nullish(),
    productStandardTestProcedure: z.object({ stpNumber: text }).nullish() }).nullish(),
});
const list = <T extends z.ZodType>(schema: T) => z.array(schema).nullish().transform((value) => value ?? []);

/** A product's procedure steps as the backend returns them. */
export const savedRoutesSchema = z.array(z.object({
  id: z.string().nullish(), order: z.number().nullish(), operation: item, estimatedTime: text,
  isCritical: z.boolean().nullish().transform((value) => value ?? false),
  workCenters: list(z.object({ workCenter: item })), responsibleUsers: list(responsible), responsibleRoles: list(responsible),
})).nullish().transform((value) => value ?? []);
export type SavedRoutes = z.infer<typeof savedRoutesSchema>;

/** The product's analytical raw data, offered when a party's instruction is ATR. */
export const ardOptionSourceSchema = z.array(z.object({
  id: z.string(), stage: z.number().nullish(), stpNumber: z.string().nullish(),
  productStandardTestProcedure: z.object({ stpNumber: z.string().nullish() }).nullish(),
})).nullish().transform((value) => value ?? []);
