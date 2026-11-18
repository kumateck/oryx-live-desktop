import { Link, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetTemplateRepairContextQuery } from "../api/template-repair-api";
import { useTemplateRepair } from "../hooks/use-template-repair";
import { templateRepairContextSchema, templateRepairAudit, templateRepairPermissions, type TemplateRepairContext } from "../lib/template-repair-schema";
import { TemplateRepairSelection } from "./template-repair-selection";
import { TemplateRepairHistory } from "./template-repair-history";

function LoadedRepair({ context, refresh }: { context: TemplateRepairContext; refresh: () => void }) {
  const repair = useTemplateRepair(context, refresh);
  return <article className="min-w-0 space-y-5">
    <PageHeader title={`Repair ${context.formName}`} crumbs={[{ label: "Templates", to: "/settings/templates" }, { label: "Repair template" }]} />
    <p className="max-w-prose text-sm text-muted-foreground">Give fields added to this template to analysts on open tests. Review the assignments before applying. Saved answers are kept. Closed and governed worksheets require their revision workflow.</p>
    {repair.receipt ? <section role="status" className="space-y-2">
      <h2 className="font-semibold">Template repair saved</h2>
      <p className="text-sm">{repair.receipt.fieldsAdded} fields assigned across {repair.receipt.formAssigneeIds.length} tests. Reopen the worksheet to load its new assignments.</p>
      <p className="break-all text-sm text-muted-foreground">Receipt: {repair.receipt.repairId}</p>
      <Button variant="outline" onClick={repair.restart}>Review remaining tests</Button>
    </section> : <form className="space-y-5" onSubmit={repair.submit("preview")}>
      <TemplateRepairSelection context={context} form={repair.form} assignments={repair.assignments} disabled={repair.busy} />
      {repair.problem ? <p role="alert" className="text-sm text-destructive">{repair.problem}</p> : null}
      {repair.current ? <section aria-label="Repair preview" className="space-y-4">
        <h2 className="font-semibold">Repair preview</h2>
        <p className="text-sm">{repair.current.fieldsAdded} fields will be assigned across {repair.current.tests.length} tests.</p>
        {repair.current.blockers.map(blocker => <p key={blocker} role="alert" className="text-sm text-destructive">{blocker}</p>)}
        {repair.current.tests.map(test => <div key={test.formAssigneeId} className="space-y-1 text-sm">
          <h3 className="break-words font-medium">{test.label}</h3>
          <p className="text-muted-foreground">{test.answersKept} saved answers kept</p>
          <ul className="list-disc space-y-1 pl-5">{test.added.map(field => <li key={field.formFieldId} className="break-words">{field.section} · {field.label} → {field.assigneeName}</li>)}</ul>
        </div>)}
        {repair.canApply ? <div className="max-w-xl space-y-2">
          <Label htmlFor="repair-reason">Reason for repair</Label>
          <Textarea id="repair-reason" {...repair.form.register("reason")} disabled={repair.busy} maxLength={1000} aria-describedby="repair-reason-error" />
          {repair.form.formState.errors.reason ? <p id="repair-reason-error" role="alert" className="text-sm text-destructive">{repair.form.formState.errors.reason.message}</p> : null}
        </div> : null}
      </section> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" disabled={repair.busy || !context.tests.some(t => t.eligible)}>Preview repair</Button>
        <PermissionGuard require={templateRepairPermissions.apply}><Button type="button" disabled={repair.busy || !repair.canApply || !repair.current || repair.current.blockers.length > 0} onClick={repair.submit("apply")}>Apply repair</Button></PermissionGuard>
        <Button asChild type="button" variant="ghost"><Link to="/settings/templates">Back to templates</Link></Button>
      </div>
    </form>}
    <TemplateRepairHistory formId={context.formId} />
  </article>;
}

export function TemplateRepairPage() {
  const formId = useParams().id ?? "";
  const [search] = useSearchParams();
  const query = useGetTemplateRepairContextQuery({ ...templateRepairAudit, formId, ...(search.get("assignment") ? { formAssigneeId: search.get("assignment") ?? "" } : {}) }, { refetchOnMountOrArgChange: true });
  const parsed = templateRepairContextSchema.safeParse(query.currentData);
  if (query.isLoading) return <FormPageSkeleton label="Loading template repair" />;
  if (query.error || !parsed.success || parsed.data.formId !== formId) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold">Template repair unavailable</h1>
    <p className="text-sm">{query.error ? apiErrorMessage(query.error) : "The server returned a template repair context that could not be verified."}</p>
    <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button>
  </section>;
  return <LoadedRepair key={formId} context={parsed.data} refresh={() => void query.refetch()} />;
}
