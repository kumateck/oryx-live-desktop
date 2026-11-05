import { useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetFormulaRepairContextQuery } from "@/shared/formula/repairs/api";
import { repairContextSchema, type RepairContext } from "../schemas/formula-repair-schema";
import { questionsAudit } from "../lib/questions";
import { FormulaRepairForm } from "./formula-repair-form";

function LoadedRepair({ context, atr, field, refresh }: { context: RepairContext; atr: string | null; field: string | null; refresh: () => void }) {
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Repair ${context.label}`} crumbs={[{ label: "Questions", to: "/settings/questions" }, { label: "Repair formula" }]} />
    <p className="text-sm text-muted-foreground">Correct the expression and manual-input labels, preview the impact, then give a reason and apply. Table layout, weights, constants, units and precision stay as configured. Submitted and governed tests require their own revision workflow.</p>
    <FormulaRepairForm context={context} atr={atr} field={field} refresh={refresh} />
  </article>;
}

export function FormulaRepairPage() {
  const questionId = useParams().id ?? "";
  const [search] = useSearchParams();
  const query = useGetFormulaRepairContextQuery({ ...questionsAudit, questionId }, { refetchOnMountOrArgChange: true });
  const parsed = repairContextSchema.safeParse(query.currentData);
  if (query.isLoading) return <FormPageSkeleton label="Loading formula repair" />;
  if (query.error || !parsed.success || parsed.data.questionId !== questionId) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold">Formula repair unavailable</h1><p className="text-sm">{query.error ? apiErrorMessage(query.error) : "The server returned a repair context that could not be verified."}</p>
    <Button type="button" variant="outline" onClick={() => void query.refetch()}>Retry</Button></section>;
  return <LoadedRepair key={questionId} context={parsed.data} atr={search.get("atr")} field={search.get("field")} refresh={() => void query.refetch()} />;
}
