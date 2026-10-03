import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { settingsApi } from "@/shared/api/generated/settings";
import { generateCode } from "@/shared/codes/generate-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { materialKindLabels, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePostApiV1MaterialMutation, usePutApiV1MaterialByMaterialIdMutation } from "../api/material-api";
import { audit, codeLetter, codeModels, materialPermissions } from "../lib/materials";
import { materialFormSchema, type Material, type MaterialFormValues } from "../schemas/material-schema";

const { useGetApiV1CollectionByItemTypeQuery, useGetApiV1ConfigurationByModelTypeByModelTypeQuery, useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;

/** Adds a material to the master list, or corrects one. The kind is fixed by the list it is opened from. */
export function MaterialDialog({ kind, material, onClose }: { kind: MaterialKind; material?: Material; onClose: () => void }) {
  const categories = useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "MaterialCategory", materialKind: kind });
  const rule = useGetApiV1ConfigurationByModelTypeByModelTypeQuery({ ...audit, modelType: codeModels[kind] }, { skip: Boolean(material) });
  const [countUsed] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [create, creating] = usePostApiV1MaterialMutation();
  const [update, updating] = usePutApiV1MaterialByMaterialIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<MaterialFormValues>({ resolver: zodResolver(materialFormSchema), defaultValues: { name: material?.name ?? "", code: material?.code ?? "",
    category: material?.category ? { value: material.category.id, label: material.category.name } : null, pharmacopoeia: material?.pharmacopoeia ?? "", description: material?.description ?? "" } });
  // Read here so the dialog re-renders, and its fields show their messages, when validation fails.
  void form.formState.errors;
  const [name, category] = useWatch({ control: form.control, name: ["name", "category"] });
  const letter = codeLetter(kind, name, category?.label ?? null);
  // The code is suggested from the numbering rule and the letter; once the user types their own, it is left alone.
  const suggested = useRef("");
  useEffect(() => {
    if (material || !rule.data || rule.data.namingType === undefined || !letter) return;
    const current = form.getValues("code");
    if (current && current !== suggested.current) return;
    const settings = rule.data;
    const prefix = `${settings.prefix ?? ""}${letter}`;
    let cancelled = false;
    void countUsed({ ...audit, modelType: codeModels[kind], prefix }).unwrap().catch(() => 0).then((used) => {
      if (cancelled) return;
      const next = generateCode({ prefix, namingType: settings.namingType ?? 0, minimumLength: settings.minimumNameLength ?? 0, maximumLength: settings.maximumNameLength ?? 0 }, typeof used === "number" ? used : 0);
      if (next) { suggested.current = next; form.setValue("code", next, { shouldValidate: true }); }
    });
    return () => { cancelled = true; };
  }, [material, rule.data, letter, kind, countUsed, form]);
  const options = useMemo(() => (categories.data ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), [categories.data]);
  const fields = useMemo((): WizardField<MaterialFormValues>[] => [
    { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
    { type: InputTypes.SELECT, name: "category", label: "Category", mode: "single", source: "sync", options, required: true, placeholder: categories.isLoading ? "Loading…" : options.length ? "Select a category" : "No categories are set up for this kind" },
    { type: InputTypes.TEXT, name: "code", label: "Code", required: true, ...(material ? {} : { description: "Suggested from the numbering rule; it can be changed." }) },
    ...(kind === 0 ? [{ type: InputTypes.TEXT, name: "pharmacopoeia", label: "Pharmacopoeia", placeholder: "e.g. BP, USP" } satisfies WizardField<MaterialFormValues>] : []),
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3, className: "md:col-span-2" },
  ], [options, categories.isLoading, kind, material]);
  const busy = creating.isLoading || updating.isLoading;

  const permission = usePermissionAction(material ? materialPermissions.edit[kind] : materialPermissions.create[kind]);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (!values.category) return;
    // The server replaces every field, so the ones this form does not show are sent back as they are.
    const body = { name: values.name, code: values.code, materialCategoryId: values.category.value, kind, pharmacopoeia: kind === 0 ? values.pharmacopoeia || null : null, description: values.description || null, alphabet: material?.alphabet ?? null };
    const result = material ? await update({ ...audit, materialId: material.id, domainEntitiesMaterialsCreateMaterialRequest: body }) : await create({ ...audit, domainEntitiesMaterialsCreateMaterialRequest: body });
    if ("error" in result) { const reason = apiErrorMessage(result.error);
      if (/already exists/i.test(reason)) form.setError("code", { message: "A material with this name and code already exists" }); else setMessage(reason);
      return; }
    toast.success(material ? "Material updated" : "Material added", { description: values.name });
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{material ? `Edit ${material.name}` : `Add a ${materialKindLabels[kind].toLowerCase()} material`}</DialogTitle>
        <DialogDescription>{material ? "Changes show wherever the material is used." : "The material joins the master list. Departments then link it to keep stock of it."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3"><FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : material ? "Save changes" : "Add material"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
