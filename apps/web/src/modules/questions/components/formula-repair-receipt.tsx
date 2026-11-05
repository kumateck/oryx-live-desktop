import { Button } from "@/components/ui/button";
import type { RepairReceipt } from "../schemas/formula-repair-schema";
import { FormulaRepairHistory } from "./formula-repair-history";

export function FormulaRepairReceipt({ receipt, questionId, fromTest, onBack }: { receipt: RepairReceipt; questionId: string; fromTest: boolean; onBack: () => void }) {
  const pending = receipt.responseIds?.length ?? 0;
  return <section role="status" className="space-y-3 rounded-lg border bg-card p-4">
    <h2 className="font-semibold">{receipt.alreadyApplied ? "Formula repair was already saved" : "Formula repair saved"}</h2>
    <p className="break-all text-sm">Audit reference: {receipt.repairId}</p>
    {pending ? <p className="text-sm">{pending} {pending === 1 ? "test needs" : "tests need"} recalculation. Open each test, complete any new inputs, save the readings and choose <strong>Recalculate saved readings</strong> before submitting.</p>
      : <p className="text-sm">Existing tests keep their recorded configuration. Tests started from now on use the corrected formula.</p>}
    <Button type="button" onClick={onBack}>{fromTest ? "Return to test" : "Return to questions"}</Button>
    <FormulaRepairHistory questionId={questionId} />
  </section>;
}
