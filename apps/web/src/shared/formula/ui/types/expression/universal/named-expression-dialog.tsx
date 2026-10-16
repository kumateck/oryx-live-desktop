
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { zodResolver } from "@hookform/resolvers/zod";
import { ALPHANUMERIC_VARIABLE_KEY } from "@/shared/formula/builder/universal-variable-keys";

import { NamedExpressionScope, type NamedExpressionDefinition } from "./types";

const scopeOptions: [SelectOption, SelectOption] = [
  { label: "For every sample", value: String(NamedExpressionScope.PerSample) },
  { label: "Once for the formula", value: String(NamedExpressionScope.Global) },
];
const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(100, "Use no more than 100 characters."),
  label: z.string().trim().min(1, "Label is required").max(200),
  expression: z.string().trim().min(1, "Expression is required").max(4000),
  scope: z.object({ label: z.string(), value: z.string() }, { message: "Choose the scope." }).nullable().refine((value): boolean => value !== null, "Choose the scope."),
});
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  item?: NamedExpressionDefinition | undefined;
  occupiedKeys: ReadonlySet<string>;
  onOpenChange: (open: boolean) => void;
  onSave: (item: NamedExpressionDefinition) => void;
}

const defaults = (item?: NamedExpressionDefinition): Values => ({
  key: item?.key ?? "",
  label: item?.label ?? "",
  expression: item?.expression ?? "",
  scope:
    scopeOptions.find(({ value }) => Number(value) === item?.scope) ??
    scopeOptions[0],
});

const wizardFields: WizardField<Values>[] = [
  { type: InputTypes.TEXT, name: "key", label: "Key", required: true, placeholder: "correctedValue" },
  { type: InputTypes.TEXT, name: "label", label: "Label", required: true, placeholder: "Corrected value" },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "scope", label: "Evaluation scope", required: true, options: scopeOptions },
  { type: InputTypes.TEXTAREA, name: "expression", label: "Expression", required: true, rows: 5, placeholder: ":sampleAvg * :standardFactor" },
];

export default function NamedExpressionDialog({
  open,
  item,
  occupiedKeys,
  onOpenChange,
  onSave,
}: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(item),
  });
  const { reset, setError, handleSubmit } = form;
  useEffect(() => reset(defaults(item)), [item, open, reset]);

  const save = handleSubmit((values) => {
    const key = values.key.trim();
    if (!ALPHANUMERIC_VARIABLE_KEY.test(key) && key !== item?.key) {
      setError("key", {
        message: "Use letters and numbers only; start with a letter.",
      });
      return;
    }
    if (occupiedKeys.has(key)) {
      setError("key", { message: "This key is already used." });
      return;
    }
    onSave({
      key,
      label: values.label.trim(),
      expression: values.expression.trim(),
      scope: Number(values.scope?.value ?? scopeOptions[0].value) as NamedExpressionScope,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} named expression</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormWizard form={form} fields={wizardFields} />
          <p className="text-xs text-muted-foreground">
            Per-sample expressions resolve independently for every configured
            sample.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={(event) => void save(event)}>
            Save expression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
