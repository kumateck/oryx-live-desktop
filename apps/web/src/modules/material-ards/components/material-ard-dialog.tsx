import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { materialsApi } from "@/shared/api/generated/materials";
import { ardAttachmentTypes, ardAudit, ardFilesApi, keptFields, type ArdRecord } from "@/shared/ard-records/ard-record";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { materialArdChanged, materialArdsApi } from "../api/material-ards-api";
import { ardPermissions, kindName } from "../lib/material-ards";

const schema = z.object({
  material: z.object({ value: z.string(), label: z.string() }).nullable().refine((value): boolean => value !== null, "Choose the material."),
  description: z.string().nullish(),
  attachments: z.array(z.instanceof(File)).optional(),
});
type Values = z.infer<typeof schema>;
/** What a new record is made from: the material's STP and its specification with that specification's template. */
type Source = { stp: { id: string; number: string } | null; spec: { number: string; form: { id: string; name: string } | null } | null };
const missingText = (source: Source) => [!source.stp ? "an STP" : "", !source.spec ? "a specification" : !source.spec.form ? "a template on its specification" : ""].filter(Boolean).join(" and ");

/**
 * Creating or editing a material's analytical raw data. A new record takes the material's STP, specification number and the
 * specification's template, which are shown and not typed; editing changes the description and adds files.
 */
export function MaterialArdDialog({ kind, editing, onClose }: { kind: MaterialKind; editing: ArdRecord | null; onClose: () => void }) {
  const dispatch = useDispatch();
  const permission = usePermissionAction(editing ? ardPermissions.edit[kind] : ardPermissions.create[kind]);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    material: editing?.item ? { value: editing.item.id, label: editing.item.name } : null, description: editing?.description ?? "", attachments: [] } });
  const material = useWatch({ control: form.control, name: "material" });
  void form.formState.errors;
  const [loadMaterials] = materialsApi.useLazyGetApiV1MaterialNotLinkedToArdsQuery();
  const [loadSpec] = materialArdsApi.useLazyGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery();
  const [loadStp] = materialArdsApi.useLazyGetApiV1MaterialStpsByMaterialIdMaterialQuery();
  const [create] = materialArdsApi.usePostApiV1MaterialArdMutation();
  const [update] = materialArdsApi.usePutApiV1MaterialArdByIdMutation();
  const [upload] = ardFilesApi.useUploadArdFilesMutation();
  const [source, setSource] = useState<Source | "loading" | null>(editing ? {
    stp: editing.stp?.number ? { id: editing.stp.id, number: editing.stp.number } : null,
    spec: editing.specNumber ? { number: editing.specNumber, form: editing.form } : null } : null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // The STP and specification follow the material chosen. A 404 means the material has none yet.
  const materialId = editing ? null : material?.value ?? null;
  useEffect(() => {
    if (!materialId) { if (!editing) setSource(null); return; }
    let current = true;
    setSource("loading");
    void Promise.all([
      loadSpec({ ...ardAudit, materialId }).unwrap().then((spec) => spec.specificationNumber ? { number: spec.specificationNumber, form: spec.form?.id ? { id: spec.form.id, name: spec.form.name ?? "Unnamed template" } : null } : null).catch(() => null),
      loadStp({ ...ardAudit, materialId }).unwrap().then((stp) => stp.id && stp.stpNumber ? { id: stp.id, number: stp.stpNumber } : null).catch(() => null),
    ]).then(([spec, stp]) => { if (current) setSource({ spec, stp }); });
    return () => { current = false; };
  }, [materialId, editing, loadSpec, loadStp]);

  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = loadMaterials({ ...ardAudit, kind, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: `${item.name?.trim() || "Unnamed"}${item.code ? ` (${item.code})` : ""}` }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [loadMaterials, kind]);
  const fields = useMemo(() => [
    ...(editing ? [] : [{ type: InputTypes.SELECT, mode: "single", source: "async", name: "material", label: kind === 1 ? "Packaging material" : "Raw material", required: true, loadOptions,
      placeholder: "Select a material", searchPlaceholder: "Search materials", description: "Only materials without analytical raw data are offered." } as const]),
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3 },
    { type: InputTypes.UPLOAD, name: "attachments", mode: "multiple", label: "Attach files", accept: ardAttachmentTypes, description: "Images, PDF, Word or Excel files." },
  ] as const satisfies readonly WizardField<Values>[], [editing, kind, loadOptions]);

  const ready = source !== null && source !== "loading" && source.stp && source.spec?.form ? { stp: source.stp, spec: source.spec, form: source.spec.form } : null;
  const submit = form.handleSubmit(async (values) => {
    if (!ready || !values.material) { setMessage(source && source !== "loading" ? `This material needs ${missingText(source)} first.` : "Choose the material."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true);
    setMessage("");
    try {
      const body = { stpId: ready.stp.id, formId: ready.form.id, materialId: values.material.value, specNumber: ready.spec.number, description: values.description ?? "", ...(editing ? keptFields(editing) : {}) };
      let id = editing?.id ?? createdId;
      if (editing) {
        const result = await update({ ...ardAudit, id: editing.id, domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest: body });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      } else if (!id) {
        const result = await create({ ...ardAudit, domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest: body });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
        id = typeof result.data === "string" && result.data ? result.data : null;
        setCreatedId(id);
      }
      const files = values.attachments ?? [];
      if (files.length > 0) {
        if (!id) { setMessage("The record was saved, but the app could not tell which one, so the files were not attached. Edit the record to attach them."); return; }
        const revoked = permission.check();
        if (revoked) { setMessage(`The record was saved. ${revoked} The files were not attached.`); return; }
        const uploaded = await upload({ modelType: "MaterialAnalyticalRawData", modelId: id, files });
        if ("error" in uploaded) { setMessage(`The record was saved, but the files were not attached: ${apiErrorMessage(uploaded.error)} Save again to retry the files.`); return; }
        dispatch(materialArdChanged(id));
      }
      toast.success(editing ? "Analytical raw data saved" : "Analytical raw data created");
      onClose();
    } finally { setBusy(false); }
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? `Edit analytical raw data · ${editing.item?.name ?? ""}` : `New ${kindName(kind)} material analytical raw data`}</DialogTitle>
        <DialogDescription>The record links the material's STP and specification; its tests come from the specification's template.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {editing ? <dl className="divide-y rounded-md border px-3"><DetailItem label="Material" value={editing.item ? `${editing.item.name}${editing.item.code ? ` (${editing.item.code})` : ""}` : null} /></dl> : null}
          <FormWizard form={form} fields={fields.slice(0, editing ? 0 : 1)} />
          {source === "loading" ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Looking up the material's STP and specification…</p>
            : source ? <dl className="divide-y rounded-md border px-3">
              <DetailItem label="STP" value={source.stp?.number} />
              <DetailItem label="Specification" value={source.spec?.number} />
              <DetailItem label="Template" value={source.spec?.form?.name} />
            </dl> : null}
          {source && source !== "loading" && !ready ? <p role="alert" className="text-sm text-destructive">This material needs {missingText(source)} before its analytical raw data can be {editing ? "saved" : "created"}.</p> : null}
          <FormWizard form={form} fields={fields.slice(editing ? 0 : 1)} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !ready}>{busy ? <><Spinner />Saving…</> : editing ? "Save" : "Create"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
