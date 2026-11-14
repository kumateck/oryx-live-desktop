import { useId, useMemo, useState } from "react";
import { Replace } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/shared/auth/use-access";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { useGetApiV1RequisitionByRequisitionIdMaterialOptionsQuery, usePostApiV1RequisitionByRequisitionIdMaterialOptionsMutation } from "../api/stock-issue-api";
import { choosePermission, earliestCovering, materialOptionsSchema, type MaterialOption, type MaterialOptionLine } from "../lib/material-options";
import { audit, batchNumber } from "../lib/stock-issue";
import { amount } from "./batch-breakdown";

const expiry = (value: string | null) => value ? `Earliest expiry ${formatMonthYear(value) ?? ""}` : "No expiry date";

function Option({ line, option, mayChoose, onChoose }: { line: MaterialOptionLine; option: MaterialOption; mayChoose: boolean; onChoose: () => void }) {
  const first = earliestCovering(line);
  return <li className={cn("min-w-0 space-y-1.5 rounded-md border p-3", option.isCurrent && "border-primary/60 bg-primary/5")}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><div className="break-words font-medium">{option.name}</div><div className="text-xs text-muted-foreground">{option.code ?? "No code"}</div></div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{option.isMain ? "BOM material" : "Substitute"}</Badge>
        {option.isCurrent ? <Badge>To be issued</Badge> : null}
        {first?.materialId === option.materialId && line.options.filter((item) => item.covers).length > 1 ? <Badge variant="secondary">Expires first</Badge> : null}
      </div>
    </div>
    <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
      <dt className="text-muted-foreground">Needed</dt><dd>{amount(option.quantity, option.unit)}</dd>
      <dt className="text-muted-foreground">In this store</dt>
      <dd className={option.covers ? undefined : "text-destructive"}>{amount(option.available, option.unit)}{option.covers ? "" : " · not enough"}</dd>
      <dt className="text-muted-foreground">Expiry</dt><dd>{expiry(option.earliestExpiry)}</dd>
    </dl>
    {option.batches.length ? <p className="break-words text-xs text-muted-foreground">Would use: {option.batches.map((batch) =>
      `${batchNumber(batch.number)} · ${amount(batch.quantity, option.unit)}${batch.expires ? ` · ${formatMonthYear(batch.expires) ?? ""}` : ""}`).join("; ")}</p> : null}
    {!option.isCurrent && mayChoose && line.canChange ? <Button type="button" size="sm" variant="outline" disabled={!option.covers} onClick={onChoose}>
      <Replace />Issue {option.name} instead</Button> : null}
  </li>;
}

function ChooseDialog({ requisitionId, line, option, onClose }: { requisitionId: string; line: MaterialOptionLine; option: MaterialOption; onClose: () => void }) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const permission = usePermissionAction(choosePermission);
  const [choose] = usePostApiV1RequisitionByRequisitionIdMaterialOptionsMutation();
  const current = line.options.find((item) => item.isCurrent);
  const run = async () => {
    if (busy) return;
    if (!reason.trim()) { setError("Give the reason for issuing this material."); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setBusy(true); setError("");
    const result = await choose({ ...audit, requisitionId, domainEntitiesRequisitionsChooseStockRequisitionMaterialRequest: {
      sourceMaterialId: line.sourceMaterialId, materialId: option.materialId, revision: line.revision, reason: reason.trim() } });
    setBusy(false);
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(`${option.name} will be issued`, { description: `${amount(option.quantity, option.unit)} is set aside in place of ${current?.name ?? line.sourceName}.` });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Issue {option.name} instead?</DialogTitle>
      <DialogDescription className="break-words">{amount(option.quantity, option.unit)} of {option.name} is set aside for this batch and{" "}
        {current ? `${amount(current.quantity, current.unit)} of ${current.name}` : "the current material"} is released. Only one of them is issued.</DialogDescription></DialogHeader>
    <DialogBody className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">Reason</label>
      <Textarea id={id} value={reason} maxLength={500} placeholder="For example: this lot expires first" onChange={(event) => setReason(event.currentTarget.value)} />
      {error || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
      <Button type="button" disabled={busy || !permission.allowed} onClick={() => void run()}>{busy ? <><Spinner />Changing…</> : `Issue ${option.name}`}</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}

/**
 * BOM lines this raw-material requisition may issue as another material: the BOM material or a substitute, each with its
 * own quantity. The store compares stock and expiry and picks one; the materials are never issued together.
 */
export function MaterialChoices({ requisitionId }: { requisitionId: string }) {
  const { has } = useAccess();
  const query = useGetApiV1RequisitionByRequisitionIdMaterialOptionsQuery({ ...audit, requisitionId });
  const parsed = useMemo(() => query.data ? materialOptionsSchema.safeParse(query.data) : null, [query.data]);
  const [choosing, setChoosing] = useState<{ line: MaterialOptionLine; option: MaterialOption } | null>(null);
  const lines = parsed?.success ? parsed.data : [];
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned material options the app could not read." : null;
  if (!query.isLoading && !error && lines.length === 0) return null;
  const mayChoose = has(choosePermission);
  return <section aria-label="Material to issue" className="space-y-3 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Material to issue</h2>
      <p className="text-sm text-muted-foreground">These materials have substitutes on the BOM, each with its own quantity. Issue one of them, using the stock that expires first or the one this store holds.</p></div>
    {query.isLoading ? <p role="status" className="text-sm text-muted-foreground">Checking substitutes in this store…</p>
      : error ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><span>{error}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : lines.map((line) => <div key={line.key} className="space-y-2">
        <h3 className="break-words text-sm font-medium">{line.sourceName}</h3>
        {line.canChange ? null : <p className="text-xs text-muted-foreground">{line.locked ?? "The material can no longer be changed."}</p>}
        <ul className="grid gap-2 md:grid-cols-2">{line.options.map((option) => <Option key={option.materialId} line={line} option={option} mayChoose={mayChoose}
          onChoose={() => setChoosing({ line, option })} />)}</ul>
      </div>)}
    {choosing ? <ChooseDialog requisitionId={requisitionId} line={choosing.line} option={choosing.option} onClose={() => setChoosing(null)} /> : null}
  </section>;
}
