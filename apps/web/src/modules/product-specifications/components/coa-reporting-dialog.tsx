import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { AnalysisKind, coaReportingKeys, coaReportingSchema, overridesFor, sectionsOf } from "../lib/coa-reporting";

const audit = { module: "Quality Control", subModule: "Product Specification" } as const;

/**
 * Which tests of the specification's microbial template print on the certificate of analysis. Each starts from the template's
 * "Report on COA" choice; the specification can override it. Unreported tests are still tested and kept on the worksheet.
 * Saving needs a reason, applies to every product sharing the specification number, and sends the specification for approval again.
 */
export function CoaReportingDialog({ specificationId, onClose, onSaved }: { specificationId: string; onClose: () => void; onSaved: () => void }) {
  const access = useAccess();
  const args = { ...audit, id: specificationId, analysisType: AnalysisKind.Microbial };
  const query = analyticalApi.useGetProductSpecificationCoaReportingQuery(args, { refetchOnMountOrArgChange: true });
  const [saveReporting] = analyticalApi.useSaveProductSpecificationCoaReportingMutation();
  const permission = usePermissionAction(coaReportingKeys.edit);
  const parsed = useMemo(() => query.currentData ? coaReportingSchema.safeParse(query.currentData) : null, [query.currentData]);
  const data = parsed?.success ? parsed.data : null;
  const sections = useMemo(() => sectionsOf(data?.fields ?? []), [data]);
  const [choices, setChoices] = useState<Record<string, boolean> | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = choices !== null;
  const save = async () => {
    if (!data || !choices) return;
    if (reason.trim().length < 10) { setMessage("State the reason for changing the reported tests in at least 10 characters."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setSaving(true); setMessage("");
    const result = await saveReporting({ ...args, domainEntitiesFormsSaveCoaReportingRequest: { reason: reason.trim(), overrides: overridesFor(data.fields, choices) } });
    setSaving(false);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Reported tests saved. Approve the specification again before testing against it.");
    setChoices(null); setReason(""); void query.refetch(); onSaved();
  };
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The reported tests could not be read." : null;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Microbial tests on the COA</DialogTitle>
        <DialogDescription>Choose which microbial tests print on the certificate. A test left off is still performed and kept on the worksheet, and does not count toward the certificate's conclusion.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        {query.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading tests…</p>
          : error ? <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
          : !data?.formId ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">This specification has no microbial template. Edit it and choose one first.</p>
          : <ul className="divide-y rounded-lg border bg-card">{sections.map((section) => <li key={section.id} className="space-y-1 p-3 text-sm">
            <p className="font-medium">{section.name}</p>
            {section.fields.map((field) => {
              const chosen = choices?.[field.formFieldId] ?? field.reportOnCoa;
              const id = `coa-${field.formFieldId}`;
              const differs = chosen !== field.templateReportOnCoa;
              return <div key={field.formFieldId} className="flex flex-wrap items-center justify-between gap-2 pl-3">
                <Label htmlFor={id} className="font-normal">{field.questionLabel ?? "Result"}
                  <span className="ml-2 text-xs text-muted-foreground">{differs ? `Overrides the template (${field.templateReportOnCoa ? "reported" : "not reported"})` : "As the template"}</span></Label>
                <span className="flex items-center gap-2 text-xs"><Switch id={id} aria-label={`Report ${field.questionLabel ?? "result"} on COA`} checked={chosen} disabled={!editing}
                  onCheckedChange={(checked) => setChoices((current) => current ? { ...current, [field.formFieldId]: checked } : current)} />{chosen ? "On COA" : "Not on COA"}</span>
              </div>;
            })}
          </li>)}</ul>}
        {data?.savedAt && !editing ? <p className="text-xs text-muted-foreground">Last changed {formatDateTime(data.savedAt) ?? ""}{data.reason ? `: ${data.reason}` : ""}</p> : null}
        {editing ? <div className="space-y-1"><Label htmlFor="coa-reporting-reason">Reason for the change</Label>
          <Textarea id="coa-reporting-reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Customer certificate reports TAMC, TYMC and E. coli only" /></div> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        {editing ? <><Button type="button" variant="outline" disabled={saving} onClick={() => { setChoices(null); setMessage(""); }}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>{saving ? <><Spinner />Saving…</> : "Save reported tests"}</Button></>
          : <><Button type="button" variant="outline" onClick={onClose}>Close</Button>
            {access.has(coaReportingKeys.edit) && data?.formId && data.fields.length > 0 ? <Button type="button" onClick={() => { setChoices({}); setMessage(""); }}>Edit reported tests</Button> : null}</>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
