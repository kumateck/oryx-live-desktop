import { useMemo } from "react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { formFields } from "@/shared/form-response/form-model";
import { assignedFieldIds } from "@/shared/qc/assignments";
import { QuestionType } from "@/shared/questions/question-types";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useAtrWorksheet } from "../hooks/use-atr-worksheet";
import { AtrFormulaActions } from "./atr-formula-actions";

export function AtrRepairDialog({ atrId, onClose }: { atrId: string; onClose: () => void }) {
  const sheet = useAtrWorksheet(atrId);
  const user = useCurrentUser();
  const mine = useMemo(() => assignedFieldIds(sheet.assignees, user?.id ?? null), [sheet.assignees, user?.id]);
  const fields = sheet.form ? formFields(sheet.form).filter(field => mine.has(field.id) && field.question.type === QuestionType.Formula) : [];
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Repair test</DialogTitle>
      <DialogDescription>Choose an assigned formula to repair. Results can be entered and saved after the repair.</DialogDescription></DialogHeader>
    <DialogBody>
      {sheet.loading ? <DetailPageSkeleton label="Loading test formulas" /> : sheet.error ? <p role="alert">{sheet.error}</p>
        : fields.length ? <AtrFormulaActions atrId={atrId} fields={fields} responses={sheet.responses} disabled={false} onReload={sheet.reload} />
          : <p className="text-sm text-muted-foreground">This test has no formula fields assigned to you.</p>}
    </DialogBody>
  </DialogContent></Dialog>;
}
