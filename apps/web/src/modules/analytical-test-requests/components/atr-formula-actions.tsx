import { lazy, Suspense, useState } from "react";
import { Calculator, Wrench } from "lucide-react";
import { toast } from "sonner";
import { DropdownButton } from "@/shared/actions";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { FormField } from "@/shared/form-response/form-model";
import type { FormResponseDto } from "@/shared/ard-view/dto";
import { anyFormulaRepairPermission } from "@/shared/formula/repairs/access";
import { sha256Hex } from "@/shared/formula/core/sha256";
import { useEvaluateRepairedFormulaMutation } from "@/shared/formula/repairs/api";
import { QuestionType } from "@/shared/questions/question-types";
import { atrAudit } from "../lib/atr";

const RepairPanel = lazy(() => import("@/modules/questions/formula-repair").then(module => ({ default: module.FormulaRepairPanel })));

export function AtrFormulaActions({ atrId, fields, responses, disabled, onReload, onRepaired }: {
  atrId: string; fields: readonly FormField[]; responses: readonly FormResponseDto[]; disabled: boolean; onReload: () => void;
  onRepaired?: (fieldId: string, configurationHash: string) => void;
}) {
  const [evaluate, mutation] = useEvaluateRepairedFormulaMutation();
  const permission = usePermissionAction("CanExecuteFormulaResponse");
  const [message, setMessage] = useState("");
  const [repairing, setRepairing] = useState<FormField | null>(null);
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
    <div className="flex flex-wrap justify-end gap-2">{formulas.map(field => <DropdownButton key={field.id} label={field.question.label} disabled={mutation.isLoading} items={[
      ...(field.question.id ? [{ id: "repair", label: "Repair formula", icon: Wrench, require: anyFormulaRepairPermission, onSelect: () => setRepairing(field) }] : []),
      ...(responses.some(row => row.formField?.id === field.id && row.formulaRepairPending) ? [{ id: "recalculate", label: "Recalculate saved readings", icon: Calculator,
        require: "CanExecuteFormulaResponse", disabled, disabledReason: "Save changed readings before recalculating.", onSelect: () => void recalculate(field) }] : []),
    ]} />)}</div>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {repairing?.question.id ? <Dialog open onOpenChange={open => { if (!open) setRepairing(null); }}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader><DialogTitle>Repair formula</DialogTitle>
          <DialogDescription>Repair this test's formula before saving results. Readings entered in the worksheet stay available.</DialogDescription></DialogHeader>
        <DialogBody><Suspense fallback={<p role="status">Loading formula repair…</p>}>
          <RepairPanel questionId={repairing.question.id} atr={atrId} field={repairing.id} onBack={() => setRepairing(null)}
            onApplied={definition => { onRepaired?.(repairing.id, sha256Hex(definition)); onReload(); }} />
        </Suspense></DialogBody>
      </DialogContent>
    </Dialog> : null}
  </div>;
}
