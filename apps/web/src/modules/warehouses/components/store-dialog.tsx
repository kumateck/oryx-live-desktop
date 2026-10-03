import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePostApiV1WarehouseMutation, usePutApiV1WarehouseByWarehouseIdMutation } from "../api/store-api";
import { storeAudit, storeChangeBlock, storeTypes } from "../lib/store-rules";
import { storeFormSchema, type Store, type StoreFormValues } from "../schemas/store-schema";

const fields: WizardField<StoreFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Store name", required: true },
  { type: InputTypes.RADIO, name: "type", label: "Used for", required: true, options: [...storeTypes] },
  { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
];

/** Adds a store, or changes one that has no locations yet. */
export function StoreDialog({ store, onClose }: { store: Store | null; onClose: () => void }) {
  const [create, creating] = usePostApiV1WarehouseMutation();
  const [update, updating] = usePutApiV1WarehouseByWarehouseIdMutation();
  const [message, setMessage] = useState("");
  const block = store ? storeChangeBlock(store) : null;
  const form = useForm<StoreFormValues>({ resolver: zodResolver(storeFormSchema), defaultValues: store ? { name: store.name, type: String(store.type), description: store.description ?? "" } : { name: "", type: "", description: "" } });
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const type = ([0, 1, 2, 3] as const).find((value) => String(value) === values.type);
    if (type === undefined) return;
    const body = { name: values.name, description: values.description ?? "", type };
    const result = store ? await update({ ...storeAudit, warehouseId: store.id, domainEntitiesWarehousesRequestCreateWarehouseRequest: body }) : await create({ ...storeAudit, domainEntitiesWarehousesRequestCreateWarehouseRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(store ? "Store updated" : "Store added");
    onClose();
  });
  const saving = creating.isLoading || updating.isLoading;
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{store ? `Edit ${store.name}` : "Add a store"}</DialogTitle><DialogDescription>{store ? "A store with locations cannot be changed." : "Name the store and say what it holds. Its locations are added on the Locations page."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
          <fieldset disabled={block !== null} className="min-w-0"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>{block ? "Close" : "Cancel"}</Button>
          {block ? null : <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : store ? "Save store" : "Add store"}</Button>}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
