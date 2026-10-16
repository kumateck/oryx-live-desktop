import { useController, type FieldValues } from "react-hook-form";
import type { CustomFieldProps } from "@/shared/forms/form-wizard-types";
import { TheAduseiEvaluation } from "@/shared/formula/ui/types/evaluate";
import { useAnswerField } from "../answer-context";
import { questionDefinition } from "../form-model";

/** An analyst entering the readings of a formula question; the evaluator works out the results and stores them with the readings. */
export default function FormulaAnswerField({ name, control, disabled }: CustomFieldProps<FieldValues>) {
  const field = useAnswerField(name);
  const { field: input } = useController({ name, control });
  const value = typeof input.value === "string" ? input.value : "";
  if (!field) return null;
  return <fieldset disabled={disabled} className="min-w-0 text-sm">
    <TheAduseiEvaluation option={questionDefinition(field.question)} value={value} onChange={(next) => input.onChange(next || null)} showMetaPanels={false} />
  </fieldset>;
}
