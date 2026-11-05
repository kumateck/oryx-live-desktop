import { useState } from "react";
import { Calculator, Wrench } from "lucide-react";
import { toast } from "sonner";
import { DropdownButton } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { FormField } from "@/shared/form-response/form-model";
import type { FormResponseDto } from "@/shared/ard-view/dto";
import { anyFormulaRepairPermission, formulaRepairPath } from "@/shared/formula/repairs/access";
import { useEvaluateRepairedFormulaMutation } from "@/shared/formula/repairs/api";
import { QuestionType } from "@/shared/questions/question-types";
import { atrAudit } from "../lib/atr";

export function AtrFormulaActions({ atrId, fields, responses, disabled, onReload }: {
  atrId: string; fields: readonly FormField[]; responses: readonly FormResponseDto[]; disabled: boolean; onReload: () => void;
}) {
  const [evaluate, mutation] = useEvaluateRepairedFormulaMutation();
  const permission = usePermissionAction("CanExecuteFormulaResponse");
  const [message, setMessage] = useState("");
  const recalculate = async (field: FormField) => {
    if (disabled || mutation.isLoading || !field.formulaConfigurationHash) return;
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    setMessage("");
    const result = await evaluate({ ...atrAudit, atrId, formFieldId: field.id,
      apiControllersEvaluateRepairedFormulaRequest: { expectedConfigurationHash: field.formulaConfigurationHash } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Saved readings recalculated on the server"); onReload();
  };
  const formulas = fields.filter(field => field.question.type === QuestionType.Formula && field.question.id);
  const pending = formulas.filter(field => responses.some(row => row.formField?.id === field.id && row.formulaRepairPending));
  if (!formulas.length) return null;
  return <div className="space-y-2">
    {pending.length ? <div role="status" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">Repaired {pending.length === 1 ? "formula needs" : "formulas need"} recalculation</p>
      <p>{pending.map(field => field.question.label).join(", ")}: the saved readings are kept, but results stay pending until the server recalculates them. Save any changed readings, then choose <strong>Recalculate saved readings</strong> from the field's menu. Submission and certificates wait until then.</p>
    </div> : null}
    <div className="flex flex-wrap justify-end gap-2">{formulas.map(field => <DropdownButton key={field.id} label={field.question.label} disabled={disabled || mutation.isLoading} items={[
      ...(field.question.id ? [{ id: "repair", label: "Repair formula", icon: Wrench, require: anyFormulaRepairPermission, to: formulaRepairPath(field.question.id, atrId, field.id) }] : []),
      ...(responses.some(row => row.formField?.id === field.id && row.formulaRepairPending) ? [{ id: "recalculate", label: "Recalculate saved readings", icon: Calculator,
        require: "CanExecuteFormulaResponse", onSelect: () => void recalculate(field) }] : []),
    ]} />)}</div>
    {disabled ? <p className="text-sm text-muted-foreground">Save your changes before repairing or recalculating a formula.</p> : null}
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
  </div>;
}
