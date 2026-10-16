import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ardAttachmentTypes, ardAudit, ardFilesApi, keptFields, type ArdRecord } from "@/shared/ard-records/ard-record";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { testStageLabel, testStages } from "@/shared/specifications/specification-rules";
import { productArdChanged, productArdsApi } from "../api/product-ards-api";
import { ardPermissions } from "../lib/product-ards";

const option = z.object({ value: z.string(), label: z.string() });
const schema = z.object({
  stage: option.nullable().refine((value): boolean => value !== null, "Choose the test stage."),
  stp: option.nullable().refine((value): boolean => value !== null, "Choose the STP."),
  specNumber: z.string({ message: "Enter the specification number." }).trim().min(1, "Enter the specification number."),
  description: z.string().nullish(),
  attachments: z.array(z.instanceof(File)).optional(),
});
type Values = z.infer<typeof schema>;
const stageOf = (value: string | undefined): 0 | 1 | 2 => value === "1" ? 1 : value === "2" ? 2 : 0;

/**
 * Creating or editing a product stage's analytical raw data. A new record takes the STP chosen and, from the product's
 * specification for that stage, its number and template; editing keeps the stage, STP and template.
 */
export function ProductArdDialog({ editing, onClose }: { editing: ArdRecord | null; onClose: () => void }) {
  const dispatch = useDispatch();
  const permission = usePermissionAction(editing ? ardPermissions.edit : ardPermissions.create);
  const savedStage = editing ? testStages.find((stage) => stage.value === String(editing.stage)) ?? null : null;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    stage: savedStage, stp: editing?.stp ? { value: editing.stp.id, label: editing.stp.number ?? "STP" } : null, specNumber: editing?.specNumber ?? "", description: editing?.description ?? "", attachments: [] } });
  const stage = useWatch({ control: form.control, name: "stage" });
  const stp = useWatch({ control: form.control, name: "stp" });
  void form.formState.errors;
  const [loadStps] = productArdsApi.useLazyGetApiV1ProductStpsUnlinkedToArdQuery();
  const [loadSpecs] = productArdsApi.useLazyGetApiV1ProductSpecificationsProductByIdQuery();
  const [create] = productArdsApi.usePostApiV1ProductArdMutation();
  const [update] = productArdsApi.usePutApiV1ProductArdByIdMutation();
  const [upload] = ardFilesApi.useUploadArdFilesMutation();
  const [templateForm, setTemplateForm] = useState<{ id: string; name: string } | null | "loading">(editing?.form ?? null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // The product behind each STP offered, so its specification for the stage can be looked up.
  const [products] = useState(() => new Map<string, string>());

  const stageValue = stage?.value;
  const stpId = editing ? null : stp?.value ?? null;
  useEffect(() => {
    if (editing) return;
    const productId = stpId ? products.get(stpId) : undefined;
    if (!productId || stageValue === undefined) { setTemplateForm(null); return; }
    let current = true;
    setTemplateForm("loading");
    void loadSpecs({ ...ardAudit, id: productId }).unwrap().catch(() => []).then((specs) => {
      if (!current) return;
      const spec = specs.find((item) => item.testStage === stageOf(stageValue));
      if (spec?.specificationNumber && !form.getFieldState("specNumber").isDirty) form.setValue("specNumber", spec.specificationNumber);
      setTemplateForm(spec?.form?.id ? { id: spec.form.id, name: spec.form.name ?? "Unnamed template" } : null);
    });
    return () => { current = false; };
  }, [editing, stpId, stageValue, products, loadSpecs, form]);
  // A different stage offers different STPs, so the chosen one is cleared.
  useEffect(() => { if (!editing) form.setValue("stp", null); }, [stageValue, editing, form]);

  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = loadStps({ ...ardAudit, stage: stageOf(stageValue), searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => {
      if (!item.id) return [];
      if (item.product?.id) products.set(item.id, item.product.id);
      return [{ value: item.id, label: `${item.stpNumber ?? "STP"} · ${item.product?.name ?? "Unnamed product"}` }];
    }), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [loadStps, stageValue, products]);

  const fields = useMemo(() => [
    ...(editing ? [] : [
      { type: InputTypes.SELECT, mode: "single", source: "sync", name: "stage", label: "Test stage", required: true, options: testStages, placeholder: "Select a stage" } as const,
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "stp", label: "STP", required: true, loadOptions, placeholder: stage ? "Select an STP" : "Choose the stage first", searchPlaceholder: "Search STPs",
        disabled: !stage, description: "Only STPs without analytical raw data for this stage are offered." } as const,
    ]),
    { type: InputTypes.TEXT, name: "specNumber", label: "Specification number", required: true, description: "Taken from the product's specification for the stage; change it only to correct it." },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3 },
    { type: InputTypes.UPLOAD, name: "attachments", mode: "multiple", label: "Attach files", accept: ardAttachmentTypes, description: "Images, PDF, Word or Excel files." },
  ] as const satisfies readonly WizardField<Values>[], [editing, stage, loadOptions]);

  const resolvedForm = templateForm === "loading" ? null : templateForm;
  const submit = form.handleSubmit(async (values) => {
    if (!values.stp || !values.stage) return;
    if (!resolvedForm) { setMessage("The product has no specification with a template for this stage. Create the specification first."); return; }
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true);
    setMessage("");
    try {
      const body = { stpId: values.stp.value, formId: resolvedForm.id, stage: stageOf(values.stage.value), specNumber: values.specNumber, description: values.description ?? "", ...(editing ? keptFields(editing) : {}) };
      let id = editing?.id ?? createdId;
      if (editing) {
        const result = await update({ ...ardAudit, id: editing.id, domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: body });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      } else if (!id) {
        const result = await create({ ...ardAudit, domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: body });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
        id = typeof result.data === "string" && result.data ? result.data : null;
        setCreatedId(id);
      }
      dispatch(productArdChanged(id));
      const files = values.attachments ?? [];
      if (files.length > 0) {
        if (!id) { setMessage("The record was saved, but the app could not tell which one, so the files were not attached. Edit the record to attach them."); return; }
        const revoked = permission.check();
        if (revoked) { setMessage(`The record was saved. ${revoked} The files were not attached.`); return; }
        const uploaded = await upload({ modelType: "ProductAnalyticalRawData", modelId: id, files });
        if ("error" in uploaded) { setMessage(`The record was saved, but the files were not attached: ${apiErrorMessage(uploaded.error)} Save again to retry the files.`); return; }
        dispatch(productArdChanged(id));
      }
      toast.success(editing ? "Analytical raw data saved" : "Analytical raw data created");
      onClose();
    } finally { setBusy(false); }
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? `Edit analytical raw data · ${editing.item?.name ?? ""}` : "New product analytical raw data"}</DialogTitle>
        <DialogDescription>One record per product and stage. Its tests come from the template of the product's specification for that stage.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {editing ? <dl className="divide-y rounded-md border px-3"><DetailItem label="Product" value={editing.item?.name} /><DetailItem label="Stage" value={testStageLabel(editing.stage)} />
            <DetailItem label="STP" value={editing.stp?.number} /></dl> : null}
          <FormWizard form={form} fields={fields} />
          {templateForm === "loading" ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Looking up the product's specification…</p>
            : <dl className="divide-y rounded-md border px-3"><DetailItem label="Template" value={templateForm?.name ?? (stp || editing ? "No specification template for this stage" : null)} /></dl>}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || templateForm === "loading"}>{busy ? <><Spinner />Saving…</> : editing ? "Save" : "Create"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
