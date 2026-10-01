import { useFormContext, useFormState, type FieldValues } from "react-hook-form";

export function useFieldError(name: string): string | undefined {
  const form = useFormContext<FieldValues>();
  const formState = useFormState({ control: form.control, name, exact: true });
  return form.getFieldState(name, formState).error?.message;
}
