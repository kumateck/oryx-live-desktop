import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1CollectionUomMutation, usePutApiV1CollectionUomByUomIdMutation } from "../api/collection-api";
import { collectionAudit } from "../lib/collections";
import { unitCategories, unitDefaults, unitFormSchema, unitPayload, unitTypes, type UnitRecord, type UnitValues } from "../schemas/unit-schema";

const fields = [
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.TEXT, name: "symbol", label: "Symbol", required: true, description: "For example, kg, ml, or pcs. Used in quantities and pricing." },
  { type: InputTypes.SELECT, name: "type", label: "Unit type", source: "sync", mode: "single", options: unitTypes, required: true },
  { type: InputTypes.SELECT, name: "category", label: "Category", source: "sync", mode: "single", options: unitCategories, required: true },
  { type: InputTypes.SWITCH, name: "scalable", label: "Scalable unit" },
  { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3 },
] as const satisfies readonly WizardField<UnitValues>[];

export function UnitEditor({ record, onClose }: {
  record?: UnitRecord;
  onClose: () => void;
}) {
  const form = useForm<UnitValues>({ resolver: zodResolver(unitFormSchema), defaultValues: unitDefaults(record) });
  const [create, creating] = usePostApiV1CollectionUomMutation();
  const [update, updating] = usePutApiV1CollectionUomByUomIdMutation();
  const busy = creating.isLoading || updating.isLoading;
  const [error, setError] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const dirty = form.formState.isDirty;
  const close = () => { if (!busy) { if (dirty) setDiscarding(true); else onClose(); } };
  const permission = usePermissionAction(record ? "CanEditUnitOfMeasure" : "CanCreateUnitOfMeasure");
  const save = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setError("");
    const arg = { ...collectionAudit, domainEntitiesBaseCreateUnitOfMeasure: unitPayload(values) };
    const result = record ? await update({ ...arg, uomId: record.id }) : await create(arg);
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(record ? "Unit of measure updated" : "Unit of measure added");
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent>
    <DialogHeader><DialogTitle>{record ? "Edit unit of measure" : "Add unit of measure"}</DialogTitle>
      <DialogDescription>Define how quantities are recorded and priced.</DialogDescription></DialogHeader>
    <form noValidate className="flex min-h-0 flex-1 flex-col gap-4"
    onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <DialogBody className="space-y-4"><fieldset disabled={busy}><FormWizard form={form} fields={fields} /></fieldset>
      {record ? <p className="text-xs text-muted-foreground">Changes to symbols or classification affect quantity and pricing workflows. Review existing uses before saving.</p> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {discarding ? <div role="alert" className="space-y-2 rounded-lg border p-3">
        <p>Discard your unsaved changes?</p><div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setDiscarding(false)}>Keep editing</Button>
          <Button type="button" size="sm" variant="destructive" onClick={onClose}>Discard changes</Button>
        </div>
      </div> : null}
    </DialogBody>
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
      <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Save unit"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
