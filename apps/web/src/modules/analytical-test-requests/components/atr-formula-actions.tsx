import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
  const isPending = (field: FormField) => responses.some(row => row.formField?.id === field.id && row.formulaRepairPending);
  const running = useRef(false);
  /**
   * Recalculates the given pending fields on the server from their saved readings, one request per field, rechecking access
   * before each. Every field is tried; the ones that cannot be calculated say which readings they still need.
   */
  const recalculate = async (group: readonly FormField[], automatic = false) => {
    const targets = group.filter(field => isPending(field) && field.formulaConfigurationHash);
    if (disabled || running.current || !targets.length) return;
    running.current = true;
    setMessage("");
    const problems: string[] = [];
    let done = 0;
    try {
      for (const field of targets) {
        const denied = permission.check();
        // An automatic run after a save stays quiet for someone without the recalculation permission.
        if (denied) { if (!automatic) setMessage(denied); return; }
        const result = await evaluate({ ...atrAudit, atrId, formFieldId: field.id,
          apiControllersEvaluateRepairedFormulaRequest: { expectedConfigurationHash: field.formulaConfigurationHash ?? "" } });
        if ("error" in result) problems.push(`${field.question.label}: ${apiErrorMessage(result.error)}`); else done++;
      }
    } finally { running.current = false; }
    if (problems.length) setMessage(problems.join(" "));
    if (done) toast.success(done === 1 ? "Saved readings recalculated on the server" : `Saved readings recalculated for ${String(done)} fields`);
    onReload();
  };
  // Saving the worksheet recalculates every repaired field that still needs it: no separate step after entering readings.
  const hadUnsavedWork = useRef(disabled);
  useEffect(() => {
    const justSaved = hadUnsavedWork.current && !disabled;
    hadUnsavedWork.current = disabled;
    if (justSaved) void recalculate(fields.filter(isPending), true);
    // Runs on the save transition only; the fields and responses are read as they are at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);
  const formulas = fields.filter(field => field.question.type === QuestionType.Formula && field.question.id);
  // The same formula can appear more than once on a worksheet; one repair or recalculation covers every field of it.
  const groups = [...formulas.reduce((byQuestion, field) => {
    const key = field.question.id ?? field.id;
    byQuestion.set(key, [...(byQuestion.get(key) ?? []), field]);
    return byQuestion;
  }, new Map<string, FormField[]>()).values()];
  const pending = formulas.filter(isPending);
  if (!formulas.length) return null;
  return <div className="space-y-2">
    {pending.length ? <div role="status" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">Repaired {pending.length === 1 ? "formula needs" : "formulas need"} recalculation</p>
      <p>{pending.map(field => field.question.label).join(", ")}: results stay pending until the server recalculates them from the saved readings. Enter or correct the readings and save: saving recalculates them. <strong>Recalculate saved readings</strong> in the field's menu does it again. Submission and certificates wait until then.</p>
    </div> : null}
    <div className="flex flex-wrap justify-end gap-2">{groups.map(group => { const [field] = group; if (!field) return null;
      const label = group.length > 1 ? `${field.question.label} (${String(group.length)} fields)` : field.question.label;
      return <DropdownButton key={field.id} label={label} disabled={mutation.isLoading} items={[
        ...(field.question.id ? [{ id: "repair", label: "Repair formula", icon: Wrench, require: anyFormulaRepairPermission, onSelect: () => setRepairing(field) }] : []),
        ...(group.some(isPending) ? [{ id: "recalculate", label: "Recalculate saved readings", icon: Calculator,
          require: "CanExecuteFormulaResponse", disabled, disabledReason: "Save changed readings before recalculating.", onSelect: () => void recalculate(group) }] : []),
      ]} />; })}</div>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {repairing?.question.id ? <Dialog open onOpenChange={open => { if (!open) setRepairing(null); }}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader><DialogTitle>Repair formula</DialogTitle>
          <DialogDescription>Repair this test's formula before saving results. Readings entered in the worksheet stay available.</DialogDescription></DialogHeader>
        <DialogBody><Suspense fallback={<p role="status">Loading formula repair…</p>}>
          <RepairPanel questionId={repairing.question.id} atr={atrId} field={repairing.id} onBack={() => setRepairing(null)}
            onApplied={(definition, fieldIds) => { const hash = sha256Hex(definition); for (const id of fieldIds) onRepaired?.(id, hash); onReload(); }} />
        </Suspense></DialogBody>
      </DialogContent>
    </Dialog> : null}
  </div>;
}
