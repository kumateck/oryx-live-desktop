import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePostApiV1WarehouseByRackIdShelfMutation, usePutApiV1WarehouseShelfByShelfIdMutation } from "@/modules/racks/api/rack-api";
import { shelfAudit } from "@/modules/racks/lib/rack-access";
import { shelfFormSchema, type ShelfFormValues, type StorageShelf } from "@/modules/racks/schemas/rack-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKindLabels, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useRackOptions } from "../hooks/use-storage-shelves";

/** Adds a shelf to a rack, or changes a shelf's code, name and description. Stock on the shelf is untouched. */
export function ShelfDialog({ kind, shelf, onClose }: { kind: MaterialKind; shelf: StorageShelf | null; onClose: () => void }) {
  const loadRacks = useRackOptions(kind);
  const [create, creating] = usePostApiV1WarehouseByRackIdShelfMutation();
  const [update, updating] = usePutApiV1WarehouseShelfByShelfIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ShelfFormValues>({ resolver: zodResolver(shelfFormSchema), defaultValues: shelf
    ? { rack: { value: shelf.rackId ?? shelf.id, label: shelf.rack ?? "" }, code: shelf.code, name: shelf.name, description: shelf.description }
    : { rack: null, code: "", name: "", description: "" } });
  const fields = useMemo((): WizardField<ShelfFormValues>[] => [
    // A shelf stays on the rack it was added to.
    ...(shelf ? [] : [{ type: InputTypes.SELECT, name: "rack", label: "Rack", mode: "single", source: "async", loadOptions: loadRacks, required: true, placeholder: "Select a rack", className: "md:col-span-2" } as const]),
    { type: InputTypes.TEXT, name: "code", label: "Shelf code", required: true },
    { type: InputTypes.TEXT, name: "name", label: "Shelf name", required: true },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
  ], [shelf, loadRacks]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const body = { code: values.code, name: values.name, description: values.description ?? "" };
    const result = shelf ? await update({ ...shelfAudit, shelfId: shelf.id, domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest: body })
      : await create({ ...shelfAudit, rackId: values.rack?.value ?? "", domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest: body });
    if ("error" in result) {
      const reason = apiErrorMessage(result.error);
      if (/already exists/i.test(reason)) form.setError("name", { message: "This rack already has a shelf with this name" }); else setMessage(reason);
      return;
    }
    toast.success(shelf ? "Shelf updated" : "Shelf added");
    onClose();
  });
  const saving = creating.isLoading || updating.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{shelf ? `Edit shelf ${shelf.code || shelf.name}` : `Add a ${materialKindLabels[kind].toLowerCase()} shelf`}</DialogTitle>
        <DialogDescription>{shelf ? `On rack ${[shelf.rack, shelf.location, shelf.warehouse].filter(Boolean).join(" · ") || "not recorded"}. Stock on the shelf is not affected.` : "Choose the rack and name the shelf."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : shelf ? "Save shelf" : "Add shelf"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
