import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1CollectionByItemTypeMutation, usePutApiV1CollectionByItemTypeAndItemIdMutation } from "../api/collection-api";
import { collectionAudit, type CollectionDefinition } from "../lib/collections";
import { itemDefaults, itemPayload, itemSchema, type CollectionRow, type ItemValues } from "../schemas/collection-schema";

export function ItemDialog({ definition, rows, item, audit = collectionAudit, onClose }: {
  definition: CollectionDefinition;
  rows: readonly CollectionRow[];
  item?: CollectionRow;
  audit?: { module: string; subModule: string };
  onClose: () => void;
}) {
  const form = useForm<ItemValues>({ resolver: zodResolver(itemSchema(definition, rows, item?.id)), defaultValues: itemDefaults(item) });
  const [create, creating] = usePostApiV1CollectionByItemTypeMutation();
  const [update, updating] = usePutApiV1CollectionByItemTypeAndItemIdMutation();
  const [error, setError] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const busy = creating.isLoading || updating.isLoading;
  const dirty = form.formState.isDirty;
  const close = () => { if (!busy) { if (dirty) setDiscarding(true); else onClose(); } };
  const fields: WizardField<ItemValues>[] = [{ type: InputTypes.TEXT, name: "name", label: "Name", required: true }];
  if (definition.description) fields.push({ type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3 });
  if (definition.mode === "resource") fields.push(
    { type: InputTypes.TEXT, name: "resourceType", label: "Resource type", description: "For example, Machine or Labor", required: true },
    { type: InputTypes.SWITCH, name: "available", label: "Available for use" },
  );
  if (definition.mode === "payment") fields.push({ type: InputTypes.NUMBER, name: "dueDays", label: "Due days", min: 0, step: 1, description: "Leave blank if no due period applies. Zero means due immediately." });

  const permission = usePermissionAction(item ? definition.permissions.edit : definition.permissions.create);
  const save = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setError("");
    const arg = { ...audit, itemType: definition.model, domainEntitiesBaseCreateItemRequest: itemPayload(definition, values) };
    const result = item ? await update({ ...arg, itemId: item.id }) : await create(arg);
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(item ? "Collection item updated" : "Collection item added");
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent>
    <DialogHeader><DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle><DialogDescription>{definition.label}</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.preventDefault(); void save(); }} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-4">
        <fieldset disabled={busy}><FormWizard form={form} fields={fields} /></fieldset>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {discarding ? <div role="alert" className="space-y-2 rounded-lg border p-3">
          <p>Discard your unsaved changes?</p><div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setDiscarding(false)}>Keep editing</Button>
            <Button type="button" size="sm" variant="destructive" onClick={onClose}>Discard changes</Button>
          </div>
        </div> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
        <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Save item"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
