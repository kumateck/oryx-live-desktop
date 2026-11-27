import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { QuestionType } from "@/shared/questions/question-types";
import { cfuUnits, limitText, MicrobialLimitKind, organisms, quantityUnits, type MicrobialLimit } from "./microbial-values";

const audit = { module: "Quality Control", subModule: "Microbial limits" } as const;
const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const num = z.number().nullish().transform((value) => value ?? null);
export const limitsSchema = z.object({
  microbialFormId: z.string().nullish(),
  fields: z.array(z.object({ formFieldId: z.string(), sectionName: text, questionLabel: text, questionType: z.number(), unit: text })).nullish().transform((value) => value ?? []),
  limits: z.array(z.object({ formFieldId: z.string(), kind: z.union([z.literal(0), z.literal(1)]), value: num, unit: text, organism: text, quantity: num, quantityUnit: text })).nullish().transform((value) => value ?? []),
  reason: text, savedAt: text,
});
export type LimitsData = z.infer<typeof limitsSchema>;
type Field = LimitsData["fields"][number];

/** What is being edited for one result field: no limit, or its typed limit as text inputs. */
interface Draft { on: boolean; value: string; organism: string; quantity: string; quantityUnit: string }
const draftFor = (field: Field, limit: MicrobialLimit | undefined): Draft => ({
  on: Boolean(limit), value: limit?.value === null || limit?.value === undefined ? "" : String(limit.value),
  organism: limit?.organism ?? organisms[0].value, quantity: limit?.quantity === null || limit?.quantity === undefined ? "1" : String(limit.quantity),
  quantityUnit: limit?.quantityUnit ?? (field.unit === "cfu/mL" ? "mL" : "g"),
});
const kindOf = (field: Field) => field.questionType === QuestionType.CfuCalculation ? MicrobialLimitKind.NotMoreThan : MicrobialLimitKind.Absent;

/** The request for the drafts, or the first problem with them. */
export function limitsRequest(fields: readonly Field[], drafts: Record<string, Draft>): { limits: MicrobialLimit[] } | { error: string } {
  const limits: MicrobialLimit[] = [];
  for (const field of fields) {
    const draft = drafts[field.formFieldId];
    if (!draft?.on) continue;
    const name = field.questionLabel ?? field.sectionName ?? "a result";
    if (kindOf(field) === MicrobialLimitKind.NotMoreThan) {
      const value = Number(draft.value);
      if (draft.value.trim() === "" || !Number.isFinite(value) || value < 0) return { error: `Enter the count limit for ${name} as a number of zero or more.` };
      limits.push({ formFieldId: field.formFieldId, kind: MicrobialLimitKind.NotMoreThan, value, unit: field.unit ?? cfuUnits[0], organism: null, quantity: null, quantityUnit: null });
    } else {
      const quantity = Number(draft.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) return { error: `Enter the quantity tested for ${name}, greater than zero.` };
      limits.push({ formFieldId: field.formFieldId, kind: MicrobialLimitKind.Absent, value: null, unit: null, organism: draft.organism, quantity, quantityUnit: draft.quantityUnit });
    }
  }
  return { limits };
}

/**
 * The typed microbial limits of a specification, on the result fields of its microbial template.
 * Saving needs a reason, applies to every item sharing the specification number, and sends the specification for approval again.
 */
export function MicrobialLimitsDialog({ subject, specificationId, keys, onClose, onSaved }: {
  subject: "material" | "product"; specificationId: string; keys: { view: string; edit: string }; onClose: () => void; onSaved: () => void;
}) {
  const access = useAccess();
  const material = analyticalApi.useGetMaterialSpecificationMicrobialLimitsQuery({ ...audit, id: specificationId }, { skip: subject !== "material", refetchOnMountOrArgChange: true });
  const product = analyticalApi.useGetProductSpecificationMicrobialLimitsQuery({ ...audit, id: specificationId }, { skip: subject !== "product", refetchOnMountOrArgChange: true });
  const query = subject === "material" ? material : product;
  const [saveMaterial] = analyticalApi.useSaveMaterialSpecificationMicrobialLimitsMutation();
  const [saveProduct] = analyticalApi.useSaveProductSpecificationMicrobialLimitsMutation();
  const permission = usePermissionAction(keys.edit);
  const parsed = useMemo(() => query.currentData ? limitsSchema.safeParse(query.currentData) : null, [query.currentData]);
  const data = parsed?.success ? parsed.data : null;
  const [drafts, setDrafts] = useState<Record<string, Draft> | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = access.has(keys.edit);
  const editing = drafts !== null;
  const start = () => { if (!data) return; setDrafts(Object.fromEntries(data.fields.map((field) => [field.formFieldId, draftFor(field, data.limits.find((limit) => limit.formFieldId === field.formFieldId))]))); setMessage(""); };
  const change = (id: string, next: Partial<Draft>) => setDrafts((current) => current ? { ...current, [id]: { ...current[id]!, ...next } } : current);
  const save = async () => {
    if (!data || !drafts) return;
    if (reason.trim().length < 10) { setMessage("State the reason for changing the limits in at least 10 characters."); return; }
    const built = limitsRequest(data.fields, drafts);
    if ("error" in built) { setMessage(built.error); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setSaving(true); setMessage("");
    const body = { ...audit, id: specificationId, domainEntitiesFormsSaveMicrobialLimitsRequest: { reason: reason.trim(), limits: built.limits } };
    const result = subject === "material" ? await saveMaterial(body) : await saveProduct(body);
    setSaving(false);
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Microbial limits saved. Approve the specification again before testing against it.");
    setDrafts(null); setReason(""); void query.refetch(); onSaved();
  };
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The microbial limits could not be read." : null;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Microbial limits</DialogTitle>
        <DialogDescription>Limits on the results of the specification's microbial template. They are checked when QC checks the certificate, and printed on it.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        {query.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading limits…</p>
          : error ? <div role="alert" className="space-y-2 text-sm"><p className="text-destructive">{error}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
          : !data?.microbialFormId ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">This specification has no microbial template. Edit it and choose one first.</p>
          : data.fields.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">The microbial template has no CFU calculation or growth observation questions to set limits on.</p>
          : <ul className="divide-y rounded-lg border bg-card">{data.fields.map((field) => {
            const saved = data.limits.find((limit) => limit.formFieldId === field.formFieldId);
            const draft = drafts?.[field.formFieldId];
            const id = `limit-${field.formFieldId}`;
            return <li key={field.formFieldId} className="space-y-2 p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">{field.questionLabel ?? "Result"}<span className="ml-2 text-xs font-normal text-muted-foreground">{field.sectionName}</span></p>
                {!editing ? <span className={saved ? "" : "text-muted-foreground"}>{saved ? limitText(saved) : "No limit"}</span> : null}</div>
              {draft ? <div className="flex flex-wrap items-end gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={draft.on} onChange={(event) => change(field.formFieldId, { on: event.target.checked })} />Set a limit</label>
                {draft.on && kindOf(field) === MicrobialLimitKind.NotMoreThan ? <div className="space-y-1"><Label htmlFor={`${id}-value`} className="text-xs">Not more than ({field.unit ?? "cfu"})</Label>
                  <Input id={`${id}-value`} inputMode="decimal" className="w-36" value={draft.value} onChange={(event) => change(field.formFieldId, { value: event.target.value })} /></div> : null}
                {draft.on && kindOf(field) === MicrobialLimitKind.Absent ? <>
                  <div className="space-y-1"><Label htmlFor={`${id}-organism`} className="text-xs">Absence of</Label>
                    <select id={`${id}-organism`} className="h-9 rounded-md border bg-background px-2" value={draft.organism} onChange={(event) => change(field.formFieldId, { organism: event.target.value })}>
                      {organisms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                  <div className="space-y-1"><Label htmlFor={`${id}-quantity`} className="text-xs">In</Label>
                    <Input id={`${id}-quantity`} inputMode="decimal" className="w-24" value={draft.quantity} onChange={(event) => change(field.formFieldId, { quantity: event.target.value })} /></div>
                  <div className="space-y-1"><Label htmlFor={`${id}-unit`} className="text-xs">Unit</Label>
                    <select id={`${id}-unit`} className="h-9 rounded-md border bg-background px-2" value={draft.quantityUnit} onChange={(event) => change(field.formFieldId, { quantityUnit: event.target.value })}>
                      {quantityUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></div>
                </> : null}
              </div> : null}
            </li>;
          })}</ul>}
        {data?.savedAt && !editing ? <p className="text-xs text-muted-foreground">Last changed {formatDateTime(data.savedAt) ?? ""}{data.reason ? `: ${data.reason}` : ""}</p> : null}
        {editing ? <div className="space-y-1"><Label htmlFor="limits-reason">Reason for the change</Label>
          <Textarea id="limits-reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Limits taken from the BP 2024 monograph" /></div> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter>
        {editing ? <><Button type="button" variant="outline" disabled={saving} onClick={() => { setDrafts(null); setMessage(""); }}>Cancel</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>{saving ? <><Spinner />Saving…</> : "Save limits"}</Button></>
          : <><Button type="button" variant="outline" onClick={onClose}>Close</Button>
            {canEdit && data?.microbialFormId && data.fields.length > 0 ? <Button type="button" onClick={start}>Edit limits</Button> : null}</>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
