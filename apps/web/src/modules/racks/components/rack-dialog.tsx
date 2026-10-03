import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKindLabels, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePostApiV1WarehouseByLocationIdRackMutation, usePutApiV1WarehouseRackByRackIdMutation } from "../api/rack-api";
import { useStorageLocations } from "../hooks/use-storage-racks";
import { rackAudit, shelvesPath } from "../lib/rack-access";
import { rackEditBlock, suggestRackName, suggestShelfCode } from "../lib/rack-rules";
import { rackFormSchema, type RackFormValues, type StorageRack } from "../schemas/rack-schema";
import { RackShelvesEditor } from "./rack-shelves-editor";

/** Adds a rack with its first shelves, or changes a rack's name and description. */
export function RackDialog({ kind, rack, onClose }: { kind: MaterialKind; rack: StorageRack | null; onClose: () => void }) {
  const places = useStorageLocations(kind);
  const [create, creating] = usePostApiV1WarehouseByLocationIdRackMutation();
  const [update, updating] = usePutApiV1WarehouseRackByRackIdMutation();
  const [message, setMessage] = useState("");
  const block = rack ? rackEditBlock(rack) : null;
  const form = useForm<RackFormValues>({ resolver: zodResolver(rackFormSchema), defaultValues: rack
    // The location of an existing rack cannot be changed, so it is carried only to satisfy the form.
    ? { location: { value: rack.id, label: rack.location ?? "" }, name: rack.name, description: rack.description ?? "", shelves: rack.shelves.map(({ code, name, description }) => ({ code, name, description })) }
    : { location: null, name: "", description: "", shelves: [] } });
  // Read here so the dialog re-renders, and its shelf lines show their messages, when validation fails.
  void form.formState.errors.shelves;
  const chosen = useWatch({ control: form.control, name: "location" });
  const rackName = useWatch({ control: form.control, name: "name" });
  const location = useMemo(() => places.locations.find((item) => item.id === chosen?.value) ?? null, [places.locations, chosen]);
  // A new rack is named after its location, until the user types a name of their own.
  useEffect(() => {
    if (!rack && location && !form.getFieldState("name").isDirty) form.setValue("name", suggestRackName(location), { shouldValidate: true });
  }, [rack, location, form]);
  const fields = useMemo((): WizardField<RackFormValues>[] => [
    ...(rack ? [] : [{ type: InputTypes.SELECT, name: "location", label: "Location", mode: "single", source: "sync", required: true,
      options: places.locations.map((item) => ({ value: item.id, label: [item.warehouse, item.name, item.floor].filter(Boolean).join(" · ") })),
      placeholder: places.loading ? "Loading…" : places.locations.length ? "Select a location" : `No ${materialKindLabels[kind].toLowerCase()} store has a location` } as const]),
    { type: InputTypes.TEXT, name: "name", label: "Rack name", required: true },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
  ], [rack, places.locations, places.loading, kind]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const body = { name: values.name, description: values.description ?? "", shelves: values.shelves.map((shelf) => ({ code: shelf.code, name: shelf.name, description: shelf.description ?? "" })) };
    const result = rack ? await update({ ...rackAudit, rackId: rack.id, domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest: body })
      : await create({ ...rackAudit, locationId: values.location?.value ?? "", domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest: body });
    if ("error" in result) {
      const reason = apiErrorMessage(result.error);
      if (/already exists/i.test(reason)) form.setError("name", { message: "This location already has a rack with this name" }); else setMessage(reason);
      return;
    }
    toast.success(rack ? "Rack updated" : "Rack added");
    onClose();
  });
  const saving = creating.isLoading || updating.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>{rack ? `Edit rack ${rack.name}` : `Add a ${materialKindLabels[kind].toLowerCase()} rack`}</DialogTitle>
        <DialogDescription>{rack ? [rack.warehouse, rack.location, rack.floor].filter(Boolean).join(" · ") || "Location not recorded" : "Choose where the rack stands, name it, and give it its first shelves."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
          {places.error && !rack ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{places.error}<Button type="button" size="sm" variant="outline" onClick={places.retry}>Retry</Button></p> : null}
          <fieldset disabled={block !== null} className="min-w-0 space-y-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {rack ? <p className="text-sm text-muted-foreground">This rack has {rack.shelves.length} {rack.shelves.length === 1 ? "shelf" : "shelves"}. Add, rename or remove them on the <Link className="text-primary underline-offset-2 hover:underline" to={`${shelvesPath}?type=${kind}`}>Shelves page</Link>.</p>
            : <RackShelvesEditor form={form} suggestCode={(index) => suggestShelfCode(location, rackName, index)} />}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>{block ? "Close" : "Cancel"}</Button>
          {block ? null : <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : rack ? "Save rack" : "Add rack"}</Button>}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
