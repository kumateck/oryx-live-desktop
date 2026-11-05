import { useGetFormulaRepairHistoryQuery } from "@/shared/formula/repairs/api";
import { formatDate } from "@/shared/format/dates";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { questionsAudit } from "../lib/questions";
import { repairHistorySchema } from "../schemas/formula-repair-schema";

const scope = (row: { updatedQuestion: boolean; repairedTests: number }) =>
  [row.updatedQuestion ? "shared question" : null, row.repairedTests ? `${row.repairedTests} test ${row.repairedTests === 1 ? "field" : "fields"}` : null].filter(Boolean).join(" and ");

export function FormulaRepairHistory({ questionId }: { questionId: string }) {
  const query = useGetFormulaRepairHistoryQuery({ ...questionsAudit, questionId });
  const rows = repairHistorySchema.safeParse(query.data ?? []);
  return <details className="text-sm"><summary className="cursor-pointer font-medium">Repair history</summary>
    {query.error || !rows.success ? <p role="alert">Repair history could not be loaded.</p> : query.isLoading ? <Skeleton className="mt-2 h-12 w-full" /> : rows.data.length ? <ol className="mt-2 space-y-2">
      {rows.data.map(repair => <li key={repair.id} className="space-y-1 border-b pb-2">
        <p><span className="font-medium">{formatDate(repair.appliedAt)}</span> · {repair.actorName || "Unknown operator"} · {scope(repair) || "configuration capture"}</p>
        <p className="break-words">{repair.reason}</p>
        <p className="break-all text-xs text-muted-foreground">Audit reference: {repair.id}</p></li>)}
    </ol> : <p className="mt-2 text-muted-foreground">No formula repairs recorded.</p>}</details>;
}
