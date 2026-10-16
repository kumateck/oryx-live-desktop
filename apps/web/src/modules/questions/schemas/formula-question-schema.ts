import { z } from "zod";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { FormulaScope } from "@/shared/formula/core/contracts";
import { FormulaType, formulaTypeLabels } from "@/shared/questions/question-types";
import { getFormulaVariableSyntaxError } from "../lib/variable-syntax";

export const formulaTypeOptions: SelectOption[] = [FormulaType.Simple, FormulaType.Uniformity, FormulaType.Universal].map((type) => ({ value: String(type), label: formulaTypeLabels[type] }));
/** Whether a formula's input is entered or worked out within the formula, or comes from another question of the same form. */
export const formulaScopeOptions: [SelectOption, SelectOption] = [
  { value: String(FormulaScope.Placement), label: "Inside this formula" }, { value: String(FormulaScope.Form), label: "From another form field" },
];
const option = z.object({ label: z.string(), value: z.string().min(1) });

export const questionFormulaSchema = z.object({
  label: z.string().trim().min(1, "Enter the question."),
  description: z.string().optional().default(""),
  reference: z.string().optional().default(""),
  formulaType: option.nullable().refine((value): boolean => value !== null, "Choose the formula type."),
  variableScopes: z.record(z.string(), option).default({}),
  expression: z.string().trim().min(1, "Build the formula.").superRefine((value, context) => {
    const message = getFormulaVariableSyntaxError(value);
    if (message) context.addIssue({ code: "custom", message });
  }),
});
export type QuestionFormulaValues = z.input<typeof questionFormulaSchema>;
export const formulaDefaults: QuestionFormulaValues = { label: "", description: "", reference: "", formulaType: formulaTypeOptions[0] ?? null, variableScopes: {}, expression: "" };
