import { useController, type FieldValues } from "react-hook-form";
import type { CustomFieldProps } from "@/shared/forms/form-wizard-types";
import { TableAnswerInput } from "@/shared/questions/table-answer";
import { useAnswerField } from "../answer-context";
import { questionDefinition } from "../form-model";

export default function TableAnswerField({ name, control, disabled }: CustomFieldProps<FieldValues>) {
  const field = useAnswerField(name);
  const { field: input } = useController({ name, control });
  const value = typeof input.value === "string" ? input.value : null;
  return <TableAnswerInput definition={field ? questionDefinition(field.question) : ""} value={value} onChange={(next) => input.onChange(next)} disabled={disabled} />;
}
