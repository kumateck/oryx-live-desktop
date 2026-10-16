import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { buildFormulaRevisionDraft } from "@/shared/formula/builder/definition-adapter";
import { readableVariableName, resolveVariableScopes } from "../lib/formula-question";
import { formulaScopeOptions, type QuestionFormulaValues } from "../schemas/formula-question-schema";

/** For each variable the formula uses: is it entered or worked out inside the formula, or supplied by another question of the same form? */
export function VariableScopeFields({ form, definition, preset }: { form: UseFormReturn<QuestionFormulaValues>; definition: string; preset: string }) {
  const [variables, setVariables] = useState<{ key: string; label: string }[]>([]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void buildFormulaRevisionDraft(definition, preset).then((draft) => {
        if (!active) return;
        const next = draft.definition.variables.map(({ key, label }) => ({ key, label }));
        setVariables(next);
        form.setValue("variableScopes", resolveVariableScopes(next, form.getValues("variableScopes") ?? {}), { shouldValidate: false });
      }).catch(() => { if (active) setVariables([]); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [definition, form, preset]);
  const fields = useMemo<WizardField<QuestionFormulaValues>[]>(() => variables.map((variable) => ({
    type: InputTypes.SELECT, mode: "single", source: "sync", name: `variableScopes.${encodeURIComponent(variable.key)}`, label: readableVariableName(variable),
    description: `Formula key: ${variable.key}`, options: formulaScopeOptions, required: true,
  })), [variables]);
  if (variables.length === 0) return null;
  return <section aria-label="Variable sources" className="space-y-2 rounded-md border p-3">
    <div><h3 className="text-sm font-medium">Where each value comes from</h3><p className="text-xs text-muted-foreground">Entered or worked out inside this formula, or supplied by another question in the same form.</p></div>
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
  </section>;
}
