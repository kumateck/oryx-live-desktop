import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePostApiV1WarehouseByWarehouseIdLocationMutation, usePutApiV1WarehouseLocationByLocationIdMutation } from "@/modules/warehouses/api/store-api";
import { useStoreOptions } from "@/modules/warehouses/hooks/use-stores";
import { floors, locationAudit, locationChangeBlock, locationLabel, locationNames, storeTypeLabel } from "@/modules/warehouses/lib/store-rules";
import { locationFormSchema, type LocationFormValues, type StoreLocation } from "@/modules/warehouses/schemas/store-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";

const floorOptions = floors.map((floor) => ({ value: floor, label: `${floor} floor` }));

/** Adds a location to a store, or changes one that has no racks yet. */
export function LocationDialog({ location, onClose }: { location: StoreLocation | null; onClose: () => void }) {
  const options = useStoreOptions();
  const [create, creating] = usePostApiV1WarehouseByWarehouseIdLocationMutation();
  const [update, updating] = usePutApiV1WarehouseLocationByLocationIdMutation();
  const [message, setMessage] = useState("");
  const block = location ? locationChangeBlock(location) : null;
  const form = useForm<LocationFormValues>({ resolver: zodResolver(locationFormSchema), defaultValues: location
    ? { store: { value: location.storeId ?? location.id, label: location.store ?? "" }, floor: { value: location.floor, label: `${location.floor} floor` }, area: { value: location.name, label: locationLabel(location.name) }, name: location.name, description: location.description ?? "" }
    : { store: null, floor: null, area: null, name: "", description: "" } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const chosen = useWatch({ control: form.control, name: "store" });
  const storeType = location ? location.storeType : options.stores.find((store) => store.id === chosen?.value)?.type ?? null;
  const names = storeType === null ? null : locationNames(storeType);
  // The areas belong to the store's type, so an area chosen for another store is not carried over.
  useEffect(() => {
    const area = form.getValues("area");
    if (!location && area && names && !names.some((item) => item.value === area.value)) form.setValue("area", null);
  }, [form, location, names]);
  const fields = useMemo((): WizardField<LocationFormValues>[] => [
    ...(location ? [] : [{ type: InputTypes.SELECT, name: "store", label: "Store", mode: "single", source: "sync", required: true, className: "md:col-span-2",
      options: options.stores.map((store) => ({ value: store.id, label: `${store.name} · ${storeTypeLabel(store.type)}` })), placeholder: options.loading ? "Loading…" : "Select a store" } as const]),
    { type: InputTypes.SELECT, name: "floor", label: "Floor", mode: "single", source: "sync", required: true, options: floorOptions, placeholder: "Select a floor" },
    names ? { type: InputTypes.SELECT, name: "area", label: "Area", mode: "single", source: "sync", required: true, options: names, placeholder: "Select an area" }
      : { type: InputTypes.TEXT, name: "name", label: "Area", required: true, placeholder: storeType === null ? "Choose the store first" : "Name the area" },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
  ], [location, options.stores, options.loading, names, storeType]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const name = names ? values.area?.value ?? "" : values.name?.trim() ?? "";
    if (!name) { form.setError(names ? "area" : "name", { message: "Choose or name the area" }); return; }
    const body = { name, floorName: values.floor?.value ?? "", description: values.description ?? "" };
    const result = location ? await update({ ...locationAudit, locationId: location.id, domainEntitiesWarehousesRequestCreateWarehouseLocationRequest: body })
      : await create({ ...locationAudit, warehouseId: values.store?.value ?? "", domainEntitiesWarehousesRequestCreateWarehouseLocationRequest: body });
    if ("error" in result) {
      const reason = apiErrorMessage(result.error);
      if (/already exists/i.test(reason)) setMessage("This store already has this area on this floor."); else setMessage(reason);
      return;
    }
    toast.success(location ? "Location updated" : "Location added");
    onClose();
  });
  const saving = creating.isLoading || updating.isLoading;

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{location ? `Edit ${locationLabel(location.name)}` : "Add a location"}</DialogTitle>
        <DialogDescription>{location ? `In ${location.store ?? "an unrecorded store"}. A location with racks cannot be changed.` : "A location is an area on a floor of a store. Racks are then stood in it."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {block ? <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
          {options.error && !location ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">{options.error}<Button type="button" size="sm" variant="outline" onClick={options.retry}>Retry</Button></p> : null}
          <fieldset disabled={block !== null} className="min-w-0"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></fieldset>
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>{block ? "Close" : "Cancel"}</Button>
          {block ? null : <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : location ? "Save location" : "Add location"}</Button>}
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
