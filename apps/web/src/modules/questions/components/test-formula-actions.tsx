import { lazy, Suspense, useState } from "react";
import { Wrench } from "lucide-react";
import { DropdownButton } from "@/shared/actions";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FormField } from "@/shared/form-response/form-model";
import type { FormResponseDto } from "@/shared/ard-view/dto";
import { anyFormulaRepairPermission } from "@/shared/formula/repairs/access";
import { sha256Hex } from "@/shared/formula/core/sha256";
import { QuestionType } from "@/shared/questions/question-types";

const RepairPanel = lazy(() => import("./formula-repair-page").then(module => ({ default: module.FormulaRepairPanel })));

/**
 * Formula repair for the analyst's assigned fields on a product ATR or a raw or packaging material test. A repaired field needs
 * no separate recalculation step: saving its readings recalculates it on the server, and submission recalculates anything
 * still pending and finalizes the results.
 */
export function TestFormulaActions({ testId, fields, onReload, onRepaired }: {
  /** The product ATR's id, or the material test's sampling id. The server reads which it is. */
  testId: string; fields: readonly FormField[]; responses: readonly FormResponseDto[]; disabled: boolean; onReload: () => void;
  onRepaired?: (fieldId: string, configurationHash: string) => void;
}) {
  const [repairing, setRepairing] = useState<FormField | null>(null);
  const formulas = fields.filter(field => field.question.type === QuestionType.Formula && field.question.id);
  // The same formula can appear more than once on a worksheet; one repair covers every field of it.
  const groups = [...formulas.reduce((byQuestion, field) => {
    const key = field.question.id ?? field.id;
    byQuestion.set(key, [...(byQuestion.get(key) ?? []), field]);
    return byQuestion;
  }, new Map<string, FormField[]>()).values()];
  if (!formulas.length) return null;
  return <div className="space-y-2">
    <div className="flex flex-wrap justify-end gap-2">{groups.map(group => { const [field] = group; if (!field) return null;
      const label = group.length > 1 ? `${field.question.label} (${String(group.length)} fields)` : field.question.label;
      return <DropdownButton key={field.id} label={label} items={[
        ...(field.question.id ? [{ id: "repair", label: "Repair formula", icon: Wrench, require: anyFormulaRepairPermission, onSelect: () => setRepairing(field) }] : []),
      ]} />; })}</div>
    {repairing?.question.id ? <Dialog open onOpenChange={open => { if (!open) setRepairing(null); }}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader><DialogTitle>Repair formula</DialogTitle>
          <DialogDescription>Repair this test's formula before saving results. Readings entered in the worksheet stay available.</DialogDescription></DialogHeader>
        <DialogBody><Suspense fallback={<p role="status">Loading formula repair…</p>}>
          <RepairPanel questionId={repairing.question.id} atr={testId} field={repairing.id} onBack={() => setRepairing(null)}
            onApplied={(definition, fieldIds) => { const hash = sha256Hex(definition); for (const id of fieldIds) onRepaired?.(id, hash); onReload(); }} />
        </Suspense></DialogBody>
      </DialogContent>
    </Dialog> : null}
  </div>;
}
