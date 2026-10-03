import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DomainEntitiesProcurementManufacturersManufacturerDto } from "@/shared/api/generated/procurement";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { usePostApiV1ProcurementManufacturerMutation, usePutApiV1ProcurementManufacturerByManufacturerIdMutation } from "../api/manufacturer-api";
import { manufacturerAudit, manufacturerPath, manufacturersPath, manufacturerPermissions } from "../lib/manufacturer-access";
import { emptyManufacturer, emptyMaterial, manufacturerDefaults, manufacturerFormSchema, manufacturerPayload, type ManufacturerFormValues } from "../schemas/manufacturer-form-schema";
import { ManufacturerMaterialRow } from "./manufacturer-material-row";

export function ManufacturerEditor({ manufacturer }: { manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto }) {
  const navigate = useNavigate();
  const collections = usePartnerCollections();
  const [create, creating] = usePostApiV1ProcurementManufacturerMutation();
  const [update, updating] = usePutApiV1ProcurementManufacturerByManufacturerIdMutation();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(manufacturer ? manufacturerPermissions.edit : manufacturerPermissions.create);
  const [saved, setSaved] = useState(false);
  const form = useForm<ManufacturerFormValues>({ resolver: zodResolver(manufacturerFormSchema), defaultValues: manufacturer ? manufacturerDefaults(manufacturer) : emptyManufacturer() });
  const rows = useFieldArray({ control: form.control, name: "materials" });
  const fields = [
    { type: InputTypes.TEXT, name: "name", label: "Manufacturer name", required: true },
    { type: InputTypes.TEXT, name: "address", label: "Address", required: true },
    { type: InputTypes.EMAIL, name: "email", label: "Email" },
    { type: InputTypes.SELECT, name: "country", label: "Country", mode: "single", source: "sync", options: collections.countries, required: true },
    { type: InputTypes.DATE, name: "validityDate", label: "Validity date", required: true },
  ] as const satisfies readonly WizardField<ManufacturerFormValues>[];
  const saving = creating.isLoading || updating.isLoading;

  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      const payload = manufacturerPayload(values);
      const result = manufacturer?.id
        ? await update({ ...manufacturerAudit, manufacturerId: manufacturer.id, domainEntitiesProcurementManufacturersCreateManufacturerRequest: payload })
        : await create({ ...manufacturerAudit, domainEntitiesProcurementManufacturersCreateManufacturerRequest: payload });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      setSaved(true);
      toast.success(manufacturer ? "Manufacturer updated" : "Manufacturer created");
      const savedId = manufacturer?.id ?? result.data;
      void navigate(savedId ? manufacturerPath(savedId) : manufacturersPath);
    })();
  };

  return <form noValidate onSubmit={(event) => void save(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Company</h2>
      <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
      {collections.error ? <p role="alert" className="text-sm text-destructive">{collections.error} <Button type="button" size="xs" variant="link" onClick={collections.retry}>Retry options</Button></p> : null}
    </section>
    <section className="space-y-3"><div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Manufactured materials</h2>
      <p className="text-xs text-muted-foreground">Record quantity per pack for each material.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => rows.append(emptyMaterial())}>Add material</Button></div>
      {rows.fields.map((row, index) => <ManufacturerMaterialRow key={row.id} form={form} index={index} onRemove={() => rows.remove(index)} />)}
      {form.formState.errors.materials?.message ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.materials.message}</p> : null}
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(manufacturersPath)}>Cancel</Button>
      <Button type="submit" disabled={!permission.allowed || saving || collections.loading || Boolean(collections.error)}>{saving ? <><Spinner />Saving…</> : manufacturer ? "Save manufacturer" : "Create manufacturer"}</Button></div>
  </form>;
}
