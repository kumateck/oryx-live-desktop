import { useCallback, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { migrationAudit, stockMigrationApi } from "@/modules/upload-center/api/stock-migration-api";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { maxTopUpLines, topUpLineRequest, topUpPath, topUpPermissions, topUpsPath, topUpUnits, type TopUpLine } from "../lib/top-up";
import { topUpHeaderSchema, type TopUpHeaderValues } from "../schemas/top-up-schema";
import { TopUpLineDialog } from "./top-up-line-dialog";
import { TopUpLinesTable } from "./top-up-lines-table";

const headerFields = [
  { type: InputTypes.TEXTAREA, name: "reason", label: "Reason for this top-up", required: true, rows: 3,
    description: "For example: stock ordered in August, received before go-live and missed by the opening-balance count. It stays with the stock and its approval." },
] as const satisfies readonly WizardField<TopUpHeaderValues>[];

type Open = { mode: "add" } | { mode: "edit"; line: TopUpLine } | { mode: "remove"; line: TopUpLine } | { mode: "submit" } | null;

/** Warehouse entry of stock that was in the store at go-live but missed by the opening-balance migration. */
export function TopUpEntryPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const permission = usePermissionAction(topUpPermissions.upload);
  const [create, { isLoading: saving }] = stockMigrationApi.useCreateTopUpMutation();
  const form = useForm<TopUpHeaderValues>({ resolver: zodResolver(topUpHeaderSchema), defaultValues: { reason: "" } });
  const [lines, setLines] = useState<TopUpLine[]>([]);
  const [open, setOpen] = useState<Open>(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const checkId = useId();
  const onEdit = useCallback((line: TopUpLine) => setOpen({ mode: "edit", line }), []);
  const onRemove = useCallback((line: TopUpLine) => setOpen({ mode: "remove", line }), []);
  const crumbs = [{ label: "Migration stock top-ups", to: topUpsPath }, { label: "New" }];

  if (!user?.departmentId) return <div className="space-y-4">
    <PageHeader title="New migration stock top-up" crumbs={crumbs} />
    <p role="alert" className="rounded-md border p-3 text-sm">Stock is entered for your own department's stores, and your account is not in a department. Ask an administrator to set your department, or use Settings › Upload Center › Migration stock top-up.</p>
  </div>;

  const review = form.handleSubmit(() => {
    if (lines.length === 0) { setMessage("Add at least one stock line."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage(""); setChecked(false); setOpen({ mode: "submit" });
  });

  const submit = async () => {
    const denied = permission.check();
    if (denied) { setMessage(denied); setOpen(null); return; }
    const result = await create({ ...migrationAudit, domainEntitiesMaterialsStockMigrationsCreateStockTopUpRequest: {
      departmentId: user.departmentId ?? "", reason: form.getValues("reason").trim(), ...topUpUnits, exactDates: true, lines: lines.map(topUpLineRequest) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); setOpen(null); return; }
    setSaved(true);
    toast.success("Top-up submitted for checking and approval");
    void navigate(topUpPath(result.data));
  };

  const busy = saving;
  return <div className="min-w-0 space-y-4">
    <PageHeader title="New migration stock top-up" crumbs={crumbs} />
    <UnsavedChangesGuard when={!saved && (lines.length > 0 || Boolean(form.formState.dirtyFields.reason))} />
    <p className="text-sm text-muted-foreground">
      Enter stock that was in {user.department ?? "your department"}'s stores at go-live but is missing from the opening balances, such as an order received before the system was in use.
      Materials and shelves come from the system. Existing stock is not changed: each line is added as a new lot when the top-up is approved.
    </p>
    <form noValidate onSubmit={(event) => void review(event)} className="space-y-4">
      <fieldset disabled={busy || !permission.allowed} className="min-w-0 space-y-4">
        <FormWizard form={form} fields={headerFields} />
        <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-sm font-semibold">Stock lines{lines.length ? ` · ${lines.length}` : ""}</h2>
              <p className="text-xs text-muted-foreground">One line per material batch. Lines stay on this page until you submit them.</p></div>
            <Button type="button" size="sm" variant="outline" disabled={lines.length >= maxTopUpLines} onClick={() => setOpen({ mode: "add" })}><Plus />Add stock line</Button>
          </div>
          <TopUpLinesTable lines={lines} disabled={busy || !permission.allowed} onEdit={onEdit} onRemove={onRemove} />
        </section>
        {message || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{message || permissionDeniedMessage}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void navigate(topUpsPath)}>Cancel</Button>
          <Button type="submit" disabled={busy || lines.length === 0}>Submit for approval</Button>
        </div>
      </fieldset>
    </form>

    {open?.mode === "add" || open?.mode === "edit" ? <TopUpLineDialog key={open.mode === "edit" ? open.line.key : "new"} editing={open.mode === "edit" ? open.line : null}
      lines={lines} onClose={() => setOpen(null)} onSave={(line) => {
        setLines((current) => current.some((item) => item.key === line.key) ? current.map((item) => item.key === line.key ? line : item) : [...current, line]);
        setOpen(null);
      }} /> : null}

    {open?.mode === "remove" ? <Dialog open onOpenChange={(next) => { if (!next) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Remove {open.line.material.code} batch {open.line.batchNumber}?</DialogTitle>
        <DialogDescription>The line is taken off this list. Nothing has been saved yet.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { setLines((current) => current.filter((line) => line.key !== open.line.key)); setOpen(null); }}>Remove</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}

    {open?.mode === "submit" ? <Dialog open onOpenChange={(next) => { if (!next && !saving) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Submit {lines.length} stock line{lines.length === 1 ? "" : "s"} for approval?</DialogTitle>
        <DialogDescription>The lines are checked against the system and wait for an approver. Stock is not added until then.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        <div role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <p><strong>Adding stock cannot be reversed.</strong> Once approved, these lots are added to the store and cannot be undone or deleted; a mistake can only be corrected with a stock adjustment. Check every material, batch number, quantity, shelf and date first.</p>
        </div>
        <label htmlFor={checkId} className="flex items-start gap-2 text-sm">
          <Checkbox id={checkId} checked={checked} disabled={saving} onCheckedChange={(value) => setChecked(value === true)} />
          <span>I have checked every line against the physical stock and its labels.</span>
        </label>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(null)}>Go back</Button>
        <Button type="button" disabled={!checked || saving} onClick={() => void submit()}>{saving ? <><Spinner />Submitting…</> : "Submit for approval"}</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}
  </div>;
}
