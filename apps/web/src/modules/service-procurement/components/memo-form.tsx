import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { servicesApi } from "@/shared/api/generated/services";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { amount, isoDay, memoSchema, proformaPageSchema, serviceAudit, serviceKeys, type Proforma, type ServiceMemo } from "../lib/service-procurement";

export const memoRules = {
  create: { kind: "all" as const, permissions: [serviceKeys.memoView, serviceKeys.memoCreate] },
  pay: { kind: "all" as const, permissions: [serviceKeys.memoView, serviceKeys.orderCreate] },
};
const day = (v: string | null) => v?.slice(0, 10) ?? "";
interface Values { issued: string; charge: string; materials: string; start: string; completion: string; terms: string; instructions: string }

function memoProblem(v: Values): string | null {
  if (!v.issued || !v.start || !v.completion) return "Enter the issue date and the expected start and completion.";
  if (v.completion < v.start) return "The expected completion cannot be before the expected start.";
  if (!v.charge.trim() || !(Number(v.charge) >= 0) || !v.materials.trim() || !(Number(v.materials) >= 0)) return "Enter the agreed service charge and materials cost (zero or more).";
  return null;
}

function MemoFields({ values, set, issueDate }: { values: Values; set: (change: Partial<Values>) => void; issueDate: boolean }) {
  return <>
    <div className="grid gap-3 md:grid-cols-2">
      {issueDate ? <div className="space-y-1.5"><Label htmlFor="m-issued">Issued</Label><Input id="m-issued" type="date" value={values.issued} onChange={(e) => set({ issued: e.target.value })} /></div> : null}
      <div className="space-y-1.5"><Label htmlFor="m-charge">Agreed service charge</Label><Input id="m-charge" inputMode="decimal" value={values.charge} onChange={(e) => set({ charge: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="m-materials">Agreed materials cost</Label><Input id="m-materials" inputMode="decimal" value={values.materials} onChange={(e) => set({ materials: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="m-start">Expected start</Label><Input id="m-start" type="date" value={values.start} onChange={(e) => set({ start: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="m-completion">Expected completion</Label><Input id="m-completion" type="date" value={values.completion} onChange={(e) => set({ completion: e.target.value })} /></div>
    </div>
    <div className="space-y-1.5"><Label htmlFor="m-terms">Terms and conditions</Label><Textarea id="m-terms" rows={3} value={values.terms} onChange={(e) => set({ terms: e.target.value })} /></div>
    <div className="space-y-1.5"><Label htmlFor="m-instructions">Special instructions</Label><Textarea id="m-instructions" rows={2} value={values.instructions} onChange={(e) => set({ instructions: e.target.value })} /></div>
  </>;
}

function MemoDialog({ title, description, busy, label, message, onClose, onSubmit, children }: {
  title: string; description: string; busy: boolean; label: string; message: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 min-w-0 flex-1 flex-col gap-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); onSubmit(); }}>
        <DialogBody className="space-y-3">{children}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : label}</Button></DialogFooter>
      </form></DialogContent></Dialog>;
}

/** Raise the service memo for an approved proforma. */
export function CreateMemoDialog({ proforma, onClose, onCreated }: { proforma: Proforma; onClose: () => void; onCreated: (id: string) => void }) {
  const permission = usePermissionAction(memoRules.create);
  const user = useCurrentUser();
  const [readPending] = servicesApi.useLazyGetApiV1ServiceProformaInvoicesQuery();
  const [create, creating] = servicesApi.usePostApiV1ServiceMemosMutation();
  const [values, setValues] = useState<Values>({ issued: new Date().toISOString().slice(0, 10), charge: String(proforma.charge), materials: String(Math.max(0, proforma.total - proforma.charge)), start: "", completion: "", terms: "", instructions: "" });
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    const found = memoProblem(values); if (found) { setMessage(found); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    if (!user) { setMessage("Sign in again before raising a memo."); return; }
    const fresh = await readPending({ ...serviceAudit, jobOrderId: proforma.jobOrderId, memoPending: true, page: 1, pageSize: 5 }, false);
    const pending = fresh.data ? proformaPageSchema.safeParse(fresh.data) : null;
    const still = pending?.success ? pending.data.data.find((p) => p.id === proforma.id) : undefined;
    if (!still || still.total !== proforma.total) { setMessage("This proforma changed or already has a memo. Close this and check it again."); return; }
    const result = await create({ ...serviceAudit, domainEntitiesJobRequestsCreateServiceMemoRequest: {
      jobOrderId: proforma.jobOrderId, serviceQuotationId: proforma.quotationId, serviceProviderId: proforma.providerId, issuedById: user.id, issuedDate: isoDay(values.issued),
      agreedServiceCharge: Number(values.charge), agreedMaterialsCost: Number(values.materials), expectedStartDate: isoDay(values.start), expectedCompletionDate: isoDay(values.completion),
      termsAndConditions: values.terms.trim() || null, specialInstructions: values.instructions.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Service memo raised", { description: "It stays a draft until you issue it to the provider." });
    onCreated(result.data);
  };
  return <MemoDialog title={`Service memo for ${proforma.provider}`} description={`Job order ${proforma.jobOrder} · approved proforma ${proforma.invoice ?? ""} of ${amount(proforma.total, proforma.currency)}.`}
    busy={creating.isLoading} label="Raise memo" message={message} onClose={onClose} onSubmit={() => void submit()}>
    <MemoFields values={values} set={(change) => setValues((v) => ({ ...v, ...change }))} issueDate />
  </MemoDialog>;
}

/** Change a draft memo before it is issued. */
export function EditMemoDialog({ memo, onClose }: { memo: ServiceMemo; onClose: () => void }) {
  const permission = usePermissionAction(memoRules.create);
  const [read] = servicesApi.useLazyGetApiV1ServiceMemosByIdQuery();
  const [update, updating] = servicesApi.usePutApiV1ServiceMemosByIdMutation();
  const [values, setValues] = useState<Values>({ issued: day(memo.issued), charge: String(memo.charge), materials: String(memo.materials), start: day(memo.start), completion: day(memo.completion), terms: memo.terms ?? "", instructions: memo.instructions ?? "" });
  const [message, setMessage] = useState("");
  const submit = async () => {
    setMessage("");
    const found = memoProblem(values); if (found) { setMessage(found); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const fresh = await read({ ...serviceAudit, id: memo.id }, false);
    const current = fresh.data ? memoSchema.safeParse(fresh.data) : null;
    if (!current?.success || current.data.status !== 0 || current.data.total !== memo.total) { setMessage("This memo changed after you opened it. Close this and check it again."); return; }
    const result = await update({ ...serviceAudit, id: memo.id, domainEntitiesJobRequestsUpdateServiceMemoRequest: {
      agreedServiceCharge: Number(values.charge), agreedMaterialsCost: Number(values.materials), expectedStartDate: isoDay(values.start), expectedCompletionDate: isoDay(values.completion),
      termsAndConditions: values.terms.trim() || null, specialInstructions: values.instructions.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Memo updated"); onClose();
  };
  return <MemoDialog title={`Edit ${memo.number}`} description="Only draft memos can change." busy={updating.isLoading} label="Save memo" message={message} onClose={onClose} onSubmit={() => void submit()}>
    <MemoFields values={values} set={(change) => setValues((v) => ({ ...v, ...change }))} issueDate={false} />
  </MemoDialog>;
}
