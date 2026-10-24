import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DomainEntitiesProcurementSuppliersSupplierDto, DomainEntitiesProcurementSuppliersSupplierManufacturerDto } from "@/shared/api/generated/procurement";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { usePostApiV1ProcurementSupplierMutation, usePutApiV1ProcurementSupplierBySupplierIdMutation } from "../api/supplier-api";
import { supplierAudit, supplierPath, suppliersPath, supplierPermissions } from "../lib/supplier-access";
import { emptyAssociation, emptySupplier, supplierDefaults, supplierFormSchema, supplierPayload, type SupplierFormValues } from "../schemas/supplier-form-schema";
import { usePurchaseUnitValidation } from "../hooks/use-purchase-unit-validation";
import { SupplierAssociationRow } from "./supplier-association-row";

export function SupplierEditor({ supplier, associations }: {
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  associations?: readonly DomainEntitiesProcurementSuppliersSupplierManufacturerDto[];
}) {
  const navigate = useNavigate();
  const collections = usePartnerCollections("supplier");
  const unitValidation = usePurchaseUnitValidation();
  const [create, creating] = usePostApiV1ProcurementSupplierMutation();
  const [update, updating] = usePutApiV1ProcurementSupplierBySupplierIdMutation();
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(supplier ? supplierPermissions.edit : supplierPermissions.create);
  const [saved, setSaved] = useState(false);
  const form = useForm<SupplierFormValues>({ resolver: zodResolver(supplierFormSchema), defaultValues: supplier ? supplierDefaults(supplier, associations) : emptySupplier() });
  const rows = useFieldArray({ control: form.control, name: "associations" });
  const fields = [
    { type: InputTypes.TEXT, name: "name", label: "Supplier name", required: true },
    { type: InputTypes.TEXT, name: "contactPerson", label: "Contact person", required: true },
    { type: InputTypes.EMAIL, name: "email", label: "Email", required: true },
    { type: InputTypes.TEXT, name: "contactNumber", label: "Contact number", required: true },
    { type: InputTypes.TEXT, name: "address", label: "Address", required: true, className: "sm:col-span-2" },
    { type: InputTypes.SELECT, name: "country", label: "Country", mode: "single", source: "sync", options: collections.countries, required: true },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: collections.currencies, required: true },
  ] as const satisfies readonly WizardField<SupplierFormValues>[];
  const saving = creating.isLoading || updating.isLoading || unitValidation.validating;

  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      const failures = (await unitValidation.validate(values.associations)).filter((failure) => failure !== null);
      if (failures.length) {
        for (const failure of failures) form.setError(`associations.${failure.index}.uom`, { type: "validate", message: failure.message });
        setMessage("Review the purchase units before saving this supplier.");
        return;
      }
      const deniedAfterValidation = permission.check();
      if (deniedAfterValidation) { setMessage(deniedAfterValidation); return; }
      const payload = supplierPayload(values);
      const result = supplier?.id
        ? await update({ ...supplierAudit, supplierId: supplier.id, domainEntitiesProcurementSuppliersCreateSupplierRequest: payload })
        : await create({ ...supplierAudit, domainEntitiesProcurementSuppliersCreateSupplierRequest: payload });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      setSaved(true);
      toast.success(supplier ? "Supplier updated" : "Supplier created");
      const savedId = supplier?.id ?? result.data;
      void navigate(savedId ? supplierPath(savedId) : suppliersPath);
    })();
  };

  return <form noValidate onSubmit={(event) => void save(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !saving && !saved} />
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">Company and contact</h2>
      <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
      {collections.error ? <p role="alert" className="text-sm text-destructive">{collections.error} <Button type="button" size="xs" variant="link" onClick={collections.retry}>Retry options</Button></p> : null}
    </section>
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">Materials and manufacturers</h2>
        <p className="text-xs text-muted-foreground">Choose a purchase unit and one default manufacturer for each material. The same symbol is used for pricing. Changes to standing price units go through pricing approval.</p></div>
        <Button type="button" size="sm" variant="outline" onClick={() => rows.append(emptyAssociation())}>Add material</Button></div>
      {rows.fields.map((row, index) => <SupplierAssociationRow key={row.id} form={form} index={index} onRemove={() => rows.remove(index)} />)}
      {form.formState.errors.associations?.message ? <p role="alert" className="text-sm text-destructive">{form.formState.errors.associations.message}</p> : null}
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(suppliersPath)}>Cancel</Button>
      <Button type="submit" disabled={!permission.allowed || saving || collections.loading || Boolean(collections.error)}>{saving ? <><Spinner />Saving…</> : supplier ? "Save supplier" : "Create supplier"}</Button></div>
  </form>;
}
