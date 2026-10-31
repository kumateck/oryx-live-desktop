import { useCallback, useState } from "react";
import { Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownButton } from "@/shared/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { useProcedure } from "../../hooks/use-procedure";
import { useProcedureOptions } from "../../hooks/use-procedure-options";
import { stepFromForm, type ProcedureStep } from "../../lib/procedure";
import { productPermissions } from "../../lib/product-access";
import { CopyProcedureDialog, type CopyProcedureAction } from "./copy-procedure-dialog";
import { ProcedureTable } from "./procedure-table";
import { StepDialog } from "./step-dialog";
import { randomId } from "@/shared/ids/random-id";

type Open = { mode: "add" } | { mode: "edit"; step: ProcedureStep } | { mode: "remove"; step: ProcedureStep } | { mode: "copy"; action: CopyProcedureAction } | null;

export function ProcedureSection({ productId, departmentId }: { productId: string; departmentId: string | null }) {
  const procedure = useProcedure(productId);
  const options = useProcedureOptions(productId, departmentId);
  const [open, setOpen] = useState<Open>(null);
  const onEdit = useCallback((step: ProcedureStep) => setOpen({ mode: "edit", step }), []);
  const onRemove = useCallback((step: ProcedureStep) => setOpen({ mode: "remove", step }), []);
  const copyActions = [
    { id: "copy-to-products", label: "Copy to products", description: "Apply this product’s saved procedure to products in the same department.", require: productPermissions.edit, disabled: procedure.saved.length === 0, disabledReason: "Save a procedure before copying it.", onSelect: () => setOpen({ mode: "copy", action: "to-products" }) },
    { id: "copy-from-product", label: "Copy from product", description: "Replace this product’s procedure with one from the same department.", require: productPermissions.edit, onSelect: () => setOpen({ mode: "copy", action: "from-product" }) },
    { id: "copy-to-other-department", label: "Copy to another department", description: "Apply this product’s saved procedure to products in a different department.", require: productPermissions.edit, disabled: procedure.saved.length === 0, disabledReason: "Save a procedure before copying it.", onSelect: () => setOpen({ mode: "copy", action: "to-other-department" }) },
    { id: "copy-from-other-department", label: "Copy from another department", description: "Replace this product’s procedure with one from another department.", require: productPermissions.edit, onSelect: () => setOpen({ mode: "copy", action: "from-other-department" }) },
  ] as const;

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <UnsavedChangesGuard when={procedure.dirty} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Procedure</h2>
        <p className="text-xs text-muted-foreground">{procedure.dirty ? "You have changes that are not saved yet."
          : "The operations the product goes through, in order. Drag a row to change its step."}</p></div>
      <div className="flex flex-wrap gap-2">
        {procedure.dirty ? <Button type="button" size="sm" variant="ghost" disabled={procedure.saving} onClick={procedure.discard}>Discard changes</Button> : null}
        {!procedure.dirty ? <DropdownButton label="Copy procedure" icon={Copy} items={copyActions} /> : null}
        <Button type="button" size="sm" variant="outline" disabled={procedure.saving || procedure.loading} onClick={() => setOpen({ mode: "add" })}><Plus />Add step</Button>
        <Button type="button" size="sm" disabled={!procedure.dirty || procedure.saving} onClick={() => void procedure.saveAll()}>
          {procedure.saving ? <><Spinner />Saving…</> : "Save procedure"}</Button>
      </div>
    </div>
    {departmentId ? null : <p className="text-xs text-muted-foreground">Operations are listed by department. Set the product's department on the Info section to add steps.</p>}
    {procedure.message ? <p role="alert" className="text-sm text-destructive">{procedure.message}</p> : null}
    <ProcedureTable steps={procedure.steps} loading={procedure.loading} error={procedure.error} onRetry={procedure.retry} disabled={procedure.saving}
      onReorder={procedure.setSteps} onEdit={onEdit} onRemove={onRemove} />

    {open?.mode === "add" || open?.mode === "edit" ? <StepDialog key={open.mode === "edit" ? open.step.key : "new"} editing={open.mode === "edit" ? open.step : null}
      steps={procedure.steps} options={options} onClose={() => setOpen(null)}
      onSubmit={(values) => {
        const step = stepFromForm(values, open.mode === "edit" ? open.step.key : `new-${randomId()}`);
        procedure.setSteps(open.mode === "edit" ? procedure.steps.map((item) => item.key === step.key ? step : item) : [...procedure.steps, step]);
        setOpen(null);
      }} /> : null}

    {open?.mode === "remove" ? <Dialog open onOpenChange={(next) => { if (!next) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Remove {open.step.operation.label}?</DialogTitle>
        <DialogDescription>The step is removed from the procedure when you save.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { procedure.setSteps(procedure.steps.filter((step) => step.key !== open.step.key)); setOpen(null); }}>Remove</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}

    {open?.mode === "copy" ? <CopyProcedureDialog productId={productId} departmentId={departmentId} action={open.action} steps={procedure.saved} onClose={() => setOpen(null)} /> : null}
  </section>;
}
