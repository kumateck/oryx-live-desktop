import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ConfigSettings } from "./types";

const decimalPolicySchema = z.object({
  inputDecimalPlaces: z.number().int().min(0).max(12),
  tableCalculationDecimalPlaces: z.number().int().min(0).max(12),
  finalResultDecimalPlaces: z.number().int().min(0).max(12),
});

type DecimalPolicy = z.infer<typeof decimalPolicySchema>;

const fields: Array<{
  key: keyof DecimalPolicy;
  label: string;
  placeholder: string;
}> = [
  {
    key: "inputDecimalPlaces",
    label: "Input Decimals",
    placeholder: "Maximum accepted input scale",
  },
  {
    key: "tableCalculationDecimalPlaces",
    label: "Table Calculation Decimals",
    placeholder: "Table statistic calculation scale",
  },
  {
    key: "finalResultDecimalPlaces",
    label: "Final Result Decimals",
    placeholder: "Final stored result scale",
  },
];

interface Props {
  disabled?: boolean | undefined;
  settings: ConfigSettings;
  onSettingsChange: (next: ConfigSettings) => void;
}

export default function DecimalPolicyFields({
  disabled,
  settings,
  onSettingsChange,
}: Props) {
  const values = useMemo<DecimalPolicy>(
    () => ({
      inputDecimalPlaces: settings.inputDecimalPlaces,
      tableCalculationDecimalPlaces: settings.tableCalculationDecimalPlaces,
      finalResultDecimalPlaces: settings.finalResultDecimalPlaces,
    }),
    [
      settings.inputDecimalPlaces,
      settings.tableCalculationDecimalPlaces,
      settings.finalResultDecimalPlaces,
    ],
  );
  const form = useForm<DecimalPolicy>({
    defaultValues: values,
    resolver: zodResolver(decimalPolicySchema),
  });
  const { reset, watch } = form;

  useEffect(() => {
    reset(values);
  }, [reset, values]);

  useEffect(() => {
    const subscription = watch((next, { name }) => {
      if (!name) return;
      const numeric = next[name];
      if (typeof numeric !== "number" || !Number.isInteger(numeric) || numeric < 0 || numeric > 12) return;
      if (numeric === settings[name]) return;
      onSettingsChange({ ...settings, [name]: numeric, ...(name === "finalResultDecimalPlaces" ? { decimalPlaces: numeric } : {}) });
    });
    return () => subscription.unsubscribe();
  }, [onSettingsChange, settings, watch]);
  const wizardFields: WizardField<DecimalPolicy>[] = fields.map(({ key, label, placeholder }) => ({
    type: InputTypes.NUMBER, name: key, label, placeholder, min: 0, max: 12, step: 1, required: true, disabled: Boolean(disabled),
  }));

  return (
    <fieldset className="space-y-3 border-t border-border pt-3">
      <legend className="text-xs font-semibold uppercase text-muted-foreground">
        Decimal policy
      </legend>
      <FormWizard form={form} fields={wizardFields} className="grid gap-3" />
      <p className="text-sm text-muted-foreground">
        Input scale is validated first, table statistics are rounded before
        expression evaluation, and final results use their own controlled scale.
      </p>
    </fieldset>
  );
}
