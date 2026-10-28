import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { useNextSerial } from "@/shared/qc/qc-numbers";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import {
  checkRevisionDate, documentReferences, earliestRevisionDate, linkDelta, materialSpecificationPrefix, serialNumber, specificationBaseSchema, specificationBody, specificationDefaults,
} from "@/shared/specifications/specification-rules";
import { specificationRowsSchema, specificationSchema, type Specification } from "@/shared/specifications/specification-schema";
import { SpecificationUnavailable } from "@/shared/specifications/specification-views";
import { useTemplateLoader } from "@/shared/specifications/use-template-loader";
import { materialSpecificationsApi } from "../api/material-specifications-api";
import { asKind, audit, completePath, detailPath, kindName, listOf, specPermissions } from "../lib/material-specifications";

const schema = specificationBaseSchema.extend({ materials: z.array(z.object({ value: z.string(), label: z.string() })).min(1, "Choose at least one material.") }).superRefine(checkRevisionDate);
type Values = z.input<typeof schema>;
const years = { fromYear: 2000, toYear: 2100 } as const;

function Editor({ kind, saved, linked }: { kind: MaterialKind; saved: Specification | null; linked: readonly SelectOption[] }) {
  const navigate = useNavigate();
  const { state } = useSession();
  const userId = state.status === "authenticated" ? state.session.user.id : null;
  const require = saved ? specPermissions.edit[kind] : specPermissions.create[kind];
  const permission = usePermissionAction(require);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: saved ? { ...specificationDefaults(saved), materials: [...linked] }
    : { specificationNumber: "", revisionNumber: "", supersedesNumber: "", reference: null, description: "", materials: [] } });
  const effectiveDate = useWatch({ control: form.control, name: "effectiveDate" });
  void form.formState.errors;
  const earliest = useMemo(() => earliestRevisionDate(effectiveDate), [effectiveDate]);
  const [create] = materialSpecificationsApi.usePostApiV1MaterialSpecificationsMutation();
  const [update] = materialSpecificationsApi.usePutApiV1MaterialSpecificationsByIdMutation();
  const [relink] = materialSpecificationsApi.usePostApiV1MaterialSpecificationsAddRemoveMaterialsMutation();
  const [findByNumber] = materialSpecificationsApi.useLazyGetApiV1MaterialSpecificationsMaterialsQuery();
  const [loadMaterials] = materialSpecificationsApi.useLazyGetApiV1MaterialSpecificationsMaterialsNotLinkedQuery();
  const loadTemplates = useTemplateLoader();
  const nextSerial = useNextSerial();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // The materials linked when the page opened, then after each successful save, so a retry sends only what is still to change.
  const [linkedIds, setLinkedIds] = useState(() => linked.map((item) => item.value));

  // A new specification starts with the next number in the kind's series; the user can change it.
  useEffect(() => {
    if (saved) return;
    let current = true;
    const prefix = materialSpecificationPrefix(kind);
    void nextSerial("MaterialSpecNumber", prefix).then((serial) => {
      if (current && serial !== null && !form.getFieldState("specificationNumber").isDirty) form.setValue("specificationNumber", serialNumber(prefix, serial));
    });
    return () => { current = false; };
  }, [saved, kind, nextSerial, form]);

  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = loadMaterials({ ...audit, materialKind: kind, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((material) => material.id ? [{ value: material.id, label: `${material.name?.trim() || "Unnamed"}${material.code ? ` (${material.code})` : ""}` }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [loadMaterials, kind]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "multiple", source: "async", name: "materials", label: kind === 1 ? "Packaging materials" : "Raw materials", required: true, loadOptions,
      placeholder: "Select materials", searchPlaceholder: "Search materials", description: "Only materials without a specification are offered.", className: "md:col-span-2" },
    { type: InputTypes.TEXT, name: "specificationNumber", label: "Specification number", required: true },
    { type: InputTypes.DATE, name: "effectiveDate", label: "Effective date", required: true, ...years },
    { type: InputTypes.TEXT, name: "revisionNumber", label: "Revision", required: true },
    { type: InputTypes.DATE, name: "reviewDate", label: "Revision date", required: true, minDate: earliest, ...years, description: "After the effective date and after today." },
    { type: InputTypes.TEXT, name: "supersedesNumber", label: "Supersedes", required: true, placeholder: "The number this replaces, or None" },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "reference", label: "Reference", options: documentReferences, placeholder: "Select a pharmacopoeia" },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "form", label: "Template", required: true, loadOptions: loadTemplates, placeholder: "Select a template", searchPlaceholder: "Search templates",
      description: "The tests of the specification come from this template.", className: "md:col-span-2" },
    { type: InputTypes.RICHTEXT, name: "description", label: "Notes", rows: 4, className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<Values>[], [kind, earliest, loadOptions, loadTemplates]);

  const submit = form.handleSubmit(async (raw) => {
    const values = schema.parse(raw);
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const materialIds = values.materials.map((item) => item.value);
    setSaving(true);
    try {
      if (!saved) {
        if (!userId) { setMessage("Your session could not be identified. Sign in again and retry."); return; }
        const result = await create({ ...audit, domainEntitiesMaterialSpecificationsCreateMaterialSpecificationRequest: { ...specificationBody(values), userId, materialIds } });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
        toast.success("Specification created");
        // Specifications are kept per material, so the record to complete is found by its number.
        const found = await findByNumber({ ...audit, specificationNumber: values.specificationNumber }).unwrap().catch(() => null);
        const id = specificationRowsSchema.safeParse(found ?? []).data?.[0]?.id ?? result.data;
        void navigate(id ? completePath(id) : listOf(kind));
        return;
      }
      const updated = await update({ ...audit, id: saved.id, domainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest: specificationBody(values, saved.dueDate) });
      if ("error" in updated) { setMessage(apiErrorMessage(updated.error)); return; }
      const delta = linkDelta(linkedIds, materialIds);
      if (delta.add.length > 0 || delta.remove.length > 0) {
        const denied = permission.check();
        if (denied) { setMessage(`The specification was saved, but the materials were not changed. ${denied}`); return; }
        const linkedResult = await relink({ ...audit, domainEntitiesMaterialSpecificationsAddRemoveMaterialToSpecificationRequest: { specificationNumber: values.specificationNumber, materialIdsToAdd: delta.add, materialIdsToRemove: delta.remove } });
        if ("error" in linkedResult) { setMessage(`The specification was saved, but the materials were not changed: ${apiErrorMessage(linkedResult.error)} Save again to retry the materials.`); return; }
        setLinkedIds(materialIds);
      }
      toast.success("Specification saved");
      void navigate(completePath(saved.id));
    } finally { setSaving(false); }
  });

  const title = saved ? `Edit ${saved.number}` : `New ${kindName(kind)} material specification`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Material specifications", to: listOf(kind) }, ...(saved ? [{ label: saved.number, to: detailPath(saved.id) }] : []), { label: saved ? "Edit" : "New" }]}
      actions={<PermissionGuard require={require}><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(saved ? detailPath(saved.id) : listOf(kind))}>Cancel</Button>
        <Button type="submit" form="material-specification" disabled={saving}>{saving ? <><Spinner />Saving…</> : saved ? "Save and set references" : "Create and set references"}</Button></PermissionGuard>} />
    <form id="material-specification" noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <p className="text-sm text-muted-foreground">After saving, choose the pharmacopoeia reference for each test of the template.</p>
    </form>
  </article>;
}

/** A new specification, of the kind in the address that the user may create. */
export function NewMaterialSpecificationPage() {
  const { kind } = useKindTabs(specPermissions.create);
  return kind === null ? null : <Editor key={kind} kind={kind} saved={null} linked={[]} />;
}

/** Editing a specification: its fields, and the materials linked to its number. */
export function EditMaterialSpecificationPage() {
  const { id } = useParams();
  const query = materialSpecificationsApi.useGetApiV1MaterialSpecificationsByIdQuery(id ? { ...audit, id } : skipToken);
  const spec = useMemo(() => query.data ? specificationSchema.safeParse(query.data) : null, [query.data]);
  const number = spec?.success ? spec.data.specificationNumber : null;
  const links = materialSpecificationsApi.useGetApiV1MaterialSpecificationsMaterialsQuery(number ? { ...audit, specificationNumber: number } : skipToken);
  const linked = useMemo(() => {
    const rows = specificationRowsSchema.safeParse(links.data ?? []);
    const items = (rows.success ? rows.data : []).flatMap((row) => row.item ? [{ value: row.item.id, label: `${row.item.name}${row.item.code ? ` (${row.item.code})` : ""}` }] : []);
    const own = spec?.success ? spec.data.item : null;
    return items.length > 0 ? items : own ? [{ value: own.id, label: `${own.name}${own.code ? ` (${own.code})` : ""}` }] : [];
  }, [links.data, spec]);
  if (query.isLoading || links.isLoading) return <FormPageSkeleton label="Loading specification" />;
  const kind = spec?.success ? asKind(spec.data.item?.kind) ?? 0 : null;
  if (!spec?.success || kind === null) return <SpecificationUnavailable message={query.error ? apiErrorMessage(query.error) : "The server returned a specification the app could not read."}
    onRetry={() => void query.refetch()} back={{ label: "Material specifications", to: listOf(0) }} />;
  if (links.error) return <SpecificationUnavailable message={`The linked materials could not be loaded: ${apiErrorMessage(links.error)}`} onRetry={() => void links.refetch()} back={{ label: "Material specifications", to: listOf(kind) }} />;
  return <Editor key={spec.data.id} kind={kind} saved={spec.data} linked={linked} />;
}
