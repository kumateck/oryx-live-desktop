import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { materialsApi } from "@/shared/api/generated/materials";
import { productsApi } from "@/shared/api/generated/products";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import type { PermissionRequirement } from "@/shared/auth/access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { useTemplateLoader } from "@/shared/specifications/use-template-loader";
import { routinesApi, type CoaItemBody } from "../api/routines-api";
import { coaItemsFor, coaProblems } from "../lib/coa-items";
import { analysisOptions, cadenceOptions, RequirementSubject, routinePermissions, setupAudit, typeOptions } from "../lib/routines";
import { CoaItemsEditor } from "./coa-items-editor";

const option = z.object({ value: z.string(), label: z.string() });
const pick = option.nullable().refine((value): boolean => value !== null, "Choose one.");

function Shell({ title, description, busy, message, onClose, onSubmit, submitLabel, wide, children }: {
  title: string; description: string; busy: boolean; message: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; submitLabel: string; wide?: boolean; children: React.ReactNode;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className={wide ? "sm:max-w-3xl" : "sm:max-w-lg"}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); onSubmit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">{children}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/** Runs a write after a fresh permission check, keeping its error on the dialog. */
function useSaving(require: PermissionRequirement) {
  const permission = usePermissionAction(require);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const run = async (write: () => Promise<{ error?: unknown } | object>, done: () => void) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true); setMessage("");
    const result = await write();
    setBusy(false);
    if ("error" in result && result.error) { setMessage(apiErrorMessage(result.error as Parameters<typeof apiErrorMessage>[0])); return; }
    done();
  };
  return { busy, message, setMessage, run };
}

const scheduleSchema = z.object({ name: z.string({ message: "Name the schedule." }).trim().min(1, "Name the schedule."), type: pick, cadence: pick });
type ScheduleValues = z.input<typeof scheduleSchema>;
const scheduleFields: WizardField<ScheduleValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Routine type", required: true, options: typeOptions },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "cadence", label: "Frequency", required: true, options: cadenceOptions },
];
export function ScheduleDialog({ onClose }: { onClose: () => void }) {
  const [create] = routinesApi.useCreateDefinitionMutation();
  const saving = useSaving(routinePermissions.setupManage);
  const form = useForm<ScheduleValues>({ resolver: zodResolver(scheduleSchema), defaultValues: { name: "", type: typeOptions[0], cadence: cadenceOptions[0] } });
  const submit = form.handleSubmit((values) => saving.run(() => create({ name: values.name.trim(), type: Number(values.type?.value), cadence: Number(values.cadence?.value) }),
    () => { toast.success("Schedule created"); onClose(); }));
  return <Shell title="New schedule" description="A monthly or quarterly routine that scheduled runs are made from." busy={saving.busy} message={saving.message} onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Create schedule">
    <FormWizard form={form} fields={scheduleFields} /></Shell>;
}

/** The fields of a worksheet as certificate rows, reset whenever another worksheet is chosen. */
function useCoaRows(formId: string | null, fromSections: boolean) {
  const query = formsApi.useGetApiV1FormByFormIdQuery(formId ? { ...setupAudit, formId } : skipToken);
  const [items, setItems] = useState<CoaItemBody[]>([]);
  const data = query.data;
  useEffect(() => { setItems(data && data.id === formId ? coaItemsFor(data, fromSections) : []); }, [data, formId, fromSections]);
  return { items, setItems, loading: query.isFetching, error: query.error ? apiErrorMessage(query.error) : null };
}
const plainItems = (items: readonly CoaItemBody[]) => items.map((item) => ({ ...item, specificationText: richTextToPlain(item.specificationText).trim(), displayLabel: item.displayLabel.trim() }));

const ardSchema = z.object({ type: pick, analysisType: pick, form: pick, specNumber: z.string().nullish(), description: z.string().nullish() })
  .refine((values) => !(values.type?.value === "1" && values.analysisType?.value !== "1"), { path: ["analysisType"], message: "Environmental monitoring is microbial only." });
type ArdValues = z.input<typeof ardSchema>;
/** A routine ARD profile: the worksheet a routine analysis is tested on and which of its fields the certificate reports. Verified before use. */
export function RoutineArdDialog({ onClose }: { onClose: () => void }) {
  const [create] = routinesApi.useCreateRoutineArdMutation();
  const saving = useSaving(routinePermissions.setupManage);
  const loadTemplates = useTemplateLoader();
  const form = useForm<ArdValues>({ resolver: zodResolver(ardSchema), defaultValues: { type: typeOptions[0], analysisType: analysisOptions[0], form: null, specNumber: "", description: "" } });
  const type = useWatch({ control: form.control, name: "type" });
  const chosen = useWatch({ control: form.control, name: "form" });
  void form.formState.errors;
  const rows = useCoaRows(chosen?.value ?? null, false);
  const [tried, setTried] = useState(false);
  const problems = coaProblems(rows.items);
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Routine type", required: true, options: typeOptions },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "analysisType", label: "Analysis", required: true, options: type?.value === "1" ? analysisOptions.slice(1) : analysisOptions },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "form", label: "Worksheet", required: true, loadOptions: loadTemplates, placeholder: "Choose a template", searchPlaceholder: "Search templates", className: "md:col-span-2" },
    { type: InputTypes.TEXT, name: "specNumber", label: "Specification number" },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2 },
  ] as const satisfies readonly WizardField<ArdValues>[], [type, loadTemplates]);
  const submit = form.handleSubmit(async (values) => {
    setTried(true);
    if (problems.overall) return;
    await saving.run(() => create({ type: Number(values.type?.value), analysisType: Number(values.analysisType?.value), formId: values.form?.value ?? "", specNumber: values.specNumber?.trim() ?? "",
      description: values.description?.trim() ?? "", coaItems: plainItems(rows.items) }), () => { toast.success("Routine ARD saved for verification"); onClose(); });
  });
  return <Shell wide title="New routine ARD profile" description="One per routine type and analysis. It must be verified before samples can be added." busy={saving.busy} message={saving.message || (tried && problems.overall ? problems.overall : "")}
    onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Save for verification">
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    {chosen ? <section className="space-y-2"><h3 className="text-sm font-semibold">Certificate rows</h3>
      {rows.loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading the worksheet's fields…</p> : rows.error ? <p role="alert" className="text-sm text-destructive">{rows.error}</p>
        : <CoaItemsEditor items={rows.items} onChange={rows.setItems} problems={tried ? problems.rows : new Map()} />}</section> : null}
  </Shell>;
}

const subjects = [{ value: "raw", label: "Raw material" }, { value: "packaging", label: "Packaging material" }, { value: "product", label: "Finished product" }] as const;
type Subject = (typeof subjects)[number]["value"];
const subjectOf = (value: string | undefined): Subject => value === "packaging" ? "packaging" : value === "product" ? "product" : "raw";
function useItemLoader(subject: Subject): SelectLoader {
  const [loadMaterials] = materialsApi.useLazyGetApiV1MaterialQuery();
  const [loadProducts] = productsApi.useLazyGetApiV1ProductQuery();
  return useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = subject === "product" ? loadProducts({ ...setupAudit, searchQuery: search, page, pageSize: 20 }) : loadMaterials({ ...setupAudit, kind: subject === "packaging" ? 1 : 0, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: `${item.name ?? "Unnamed"}${item.code ? ` · ${item.code}` : ""}` }] : []), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [subject, loadMaterials, loadProducts]);
}

const requirementSchema = z.object({ subject: pick, item: pick, required: z.boolean(), reason: z.string({ message: "Give the controlled reason." }).trim().min(1, "Give the controlled reason.") });
type RequirementValues = z.input<typeof requirementSchema>;
/** Whether a material or finished product needs microbial analysis, with the reason. Verified before it applies. */
export function RequirementDialog({ onClose }: { onClose: () => void }) {
  const [create] = routinesApi.useCreateRequirementMutation();
  const saving = useSaving(routinePermissions.microbial);
  const form = useForm<RequirementValues>({ resolver: zodResolver(requirementSchema), defaultValues: { subject: subjects[0], item: null, required: true, reason: "" } });
  const subject = subjectOf(useWatch({ control: form.control, name: "subject" })?.value);
  useEffect(() => { form.setValue("item", null); }, [subject, form]);
  const loadItems = useItemLoader(subject);
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "subject", label: "Applies to", required: true, options: subjects },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "item", label: subject === "product" ? "Product" : "Material", required: true, loadOptions: loadItems, placeholder: "Choose", searchPlaceholder: "Search" },
    { type: InputTypes.SWITCH, name: "required", label: "Microbial analysis required" },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Controlled reason", required: true, rows: 3 },
  ] as const satisfies readonly WizardField<RequirementValues>[], [subject, loadItems]);
  const submit = form.handleSubmit((values) => saving.run(() => create(subject === "product"
    ? { subject: RequirementSubject.Product, productId: values.item?.value ?? "", stage: 2, required: values.required, reason: values.reason.trim() }
    : { subject: RequirementSubject.Material, materialId: values.item?.value ?? "", required: values.required, reason: values.reason.trim() }), () => { toast.success("Saved for verification"); onClose(); }));
  return <Shell title="Microbial applicability" description="Record only the materials and finished products whose microbial need is decided; each is verified before it applies." busy={saving.busy} message={saving.message}
    onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Save for verification"><FormWizard form={form} fields={fields} /></Shell>;
}

const ardCreate = { raw: "CanCreateRawMaterialArd", packaging: "CanCreatePackagingMaterialArd", product: "CanCreateProductArd" } as const;
const microbialSchema = z.object({ subject: pick, stp: pick, form: pick, specNumber: z.string({ message: "Enter the specification number." }).trim().min(1, "Enter the specification number."), description: z.string().nullish() });
type MicrobialValues = z.input<typeof microbialSchema>;
/** The separate microbial worksheet of a material or finished product, and the rows it adds to the combined certificate. */
export function MicrobialArdDialog({ onClose }: { onClose: () => void }) {
  const [create] = routinesApi.useCreateMicrobialArdMutation();
  const form = useForm<MicrobialValues>({ resolver: zodResolver(microbialSchema), defaultValues: { subject: subjects[0], stp: null, form: null, specNumber: "", description: "" } });
  const subject = subjectOf(useWatch({ control: form.control, name: "subject" })?.value);
  const chosen = useWatch({ control: form.control, name: "form" });
  void form.formState.errors;
  const saving = useSaving(ardCreate[subject]);
  useEffect(() => { form.setValue("stp", null); }, [subject, form]);
  const [loadMaterialStps] = analyticalApi.useLazyGetApiV1MaterialStpsQuery();
  const [loadProductStps] = analyticalApi.useLazyGetApiV1ProductStpsQuery();
  const [owners] = useState(() => new Map<string, string>());
  const loadStps = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = subject === "product" ? loadProductStps({ ...setupAudit, searchQuery: search, page, pageSize: 20 }) : loadMaterialStps({ ...setupAudit, materialKind: subject === "packaging" ? 1 : 0, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => {
      const owner = "material" in item ? item.material : "product" in item ? item.product : null;
      if (!item.id || !owner?.id) return [];
      owners.set(item.id, owner.id);
      return [{ value: item.id, label: `${item.stpNumber ?? "STP"} · ${owner.name ?? "Unnamed"}` }];
    }), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [subject, loadMaterialStps, loadProductStps, owners]);
  const loadTemplates = useTemplateLoader();
  const rows = useCoaRows(chosen?.value ?? null, true);
  const [tried, setTried] = useState(false);
  const problems = coaProblems(rows.items);
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "subject", label: "Applies to", required: true, options: subjects },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "stp", label: "Standard test procedure", required: true, loadOptions: loadStps, placeholder: "Choose the STP", searchPlaceholder: "Search STPs" },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "form", label: "Microbial worksheet", required: true, loadOptions: loadTemplates, placeholder: "Choose a template", searchPlaceholder: "Search templates" },
    { type: InputTypes.TEXT, name: "specNumber", label: "Specification number", required: true },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 2, className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<MicrobialValues>[], [loadStps, loadTemplates]);
  const submit = form.handleSubmit(async (values) => {
    setTried(true);
    if (problems.overall) return;
    const stpId = values.stp?.value ?? "";
    const owner = owners.get(stpId);
    if (!owner) { saving.setMessage("Choose the STP again; its material or product could not be found."); return; }
    const coaItems = plainItems(rows.items.filter((item) => item.includeOnCoa)).map(({ includeOnCoa: _chosen, ...item }) => item);
    await saving.run(() => create({ product: subject === "product", stpId, formId: values.form?.value ?? "", specNumber: values.specNumber.trim(), description: values.description?.trim() ?? "",
      ...(subject === "product" ? {} : { materialId: owner }), coaItems }), () => { toast.success("Microbial ARD created for verification"); onClose(); });
  });
  return <Shell wide title="New microbial ARD" description="Created as a separate microbial worksheet; the finished product stage is used for products." busy={saving.busy} message={saving.message || (tried && problems.overall ? problems.overall : "")}
    onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Create microbial ARD">
    <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
    {chosen ? <section className="space-y-2"><h3 className="text-sm font-semibold">Rows on the combined certificate</h3>
      {rows.loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading the worksheet's fields…</p> : rows.error ? <p role="alert" className="text-sm text-destructive">{rows.error}</p>
        : <CoaItemsEditor items={rows.items} onChange={rows.setItems} problems={tried ? problems.rows : new Map()} />}</section> : null}
  </Shell>;
}
export const microbialArdPermission = { kind: "some" as const, permissions: Object.values(ardCreate) };
