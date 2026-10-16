import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { qcApi } from "@/shared/api/generated/qc";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { routinesApi } from "../api/routines-api";
import { useBatchRecordOptions, useRndBatchOptions, useRndProjectOptions, useStepOptions } from "../lib/pickers";
import { routinePermissions, routinesPath, waterAudit, WaterStatus, type Period } from "../lib/routines";

const option = z.object({ value: z.string(), label: z.string() });
const pick = (message: string) => option.nullable().refine((value): boolean => value !== null, message);
const periodLabel = (period: Period) => `${period.samplingPoint ?? "Sampling point"} · ${formatDate(period.validFrom) ?? ""} – ${formatDate(period.validUntil) ?? ""}`;

function Shell({ title, description, busy, message, onClose, onSubmit, submitLabel, destructive, children }: {
  title: string; description: string; busy: boolean; message: string; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; submitLabel: string; destructive?: boolean; children: React.ReactNode;
}) {
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); onSubmit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">{children}{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={busy}>{busy ? <><Spinner />Saving…</> : submitLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
function useWrite() {
  const permission = usePermissionAction(routinePermissions.waterManage);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const run = async (write: () => Promise<{ error?: unknown } | { data: unknown }>, done: (data: unknown) => void) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setBusy(true); setMessage("");
    const result = await write();
    setBusy(false);
    if ("error" in result && result.error) { setMessage(apiErrorMessage(result.error as Parameters<typeof apiErrorMessage>[0])); return; }
    done("data" in result ? result.data : null);
  };
  return { busy, message, run };
}

const activateSchema = z.object({ certificate: pick("Choose an approved water certificate."), validFrom: z.date({ message: "Choose the start." }), validUntil: z.date({ message: "Choose the end." }), retrospectiveReason: z.string().nullish() })
  .refine((values) => values.validUntil > values.validFrom, { path: ["validUntil"], message: "The end must be after the start." });
type ActivateValues = z.input<typeof activateSchema>;
/** Starts coverage from an approved water certificate. A start before the certificate was issued needs a recorded QA reason. */
function ActivateDialog({ certificateId, onClose }: { certificateId: string | null; onClose: () => void }) {
  const [activate] = routinesApi.useActivatePeriodMutation();
  const [load] = qcApi.useLazyGetApiV1QcWaterQualityCertificatesQuery();
  const linked = routinesApi.useGetRoutineCertificateQuery(certificateId ?? "", { skip: !certificateId });
  const write = useWrite();
  const now = new Date();
  const form = useForm<ActivateValues>({ resolver: zodResolver(activateSchema), defaultValues: { certificate: null, validFrom: now, validUntil: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()), retrospectiveReason: "" } });
  const linkedData = linked.data;
  useEffect(() => { if (linkedData) form.setValue("certificate", { value: linkedData.id, label: linkedData.certificateCode ?? "Certificate" }); }, [linkedData, form]);
  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = load({ ...waterAudit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: `${item.certificateCode ?? "Certificate"} · ${item.samplingPoint ?? ""}` }] : []), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [load]);
  const fields: WizardField<ActivateValues>[] = [
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "certificate", label: "Approved water certificate", required: true, loadOptions, placeholder: "Choose a certificate", searchPlaceholder: "Search by certificate code" },
    { type: InputTypes.DATE, name: "validFrom", label: "Valid from", required: true, fromYear: 2020, toYear: 2100 },
    { type: InputTypes.DATE, name: "validUntil", label: "Valid until", required: true, fromYear: 2020, toYear: 2100 },
    { type: InputTypes.TEXTAREA, name: "retrospectiveReason", label: "Retrospective QA reason", rows: 2, description: "Needed when coverage starts before the certificate was issued." },
  ];
  const submit = form.handleSubmit((values) => write.run(() => activate({ routineCertificateId: values.certificate?.value ?? "", validFrom: values.validFrom.toISOString(), validUntil: values.validUntil.toISOString(),
    ...(values.retrospectiveReason?.trim() ? { retrospectiveReason: values.retrospectiveReason.trim() } : {}) }), () => { toast.success("Coverage activated"); onClose(); }));
  return <Shell title="Activate water coverage" description="Production and R&D may use water from the sampling point while its coverage is active." busy={write.busy} message={write.message} onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Activate">
    <FormWizard form={form} fields={fields} /></Shell>;
}

const useSchema = z.object({ period: pick("Choose the coverage."), usedAt: z.date({ message: "Choose when it was used." }), subject: option, record: option.nullable(), step: option.nullable(), project: option.nullable(), batch: option.nullable() })
  .superRefine((values, context) => {
    if (values.subject.value === "production" && !values.record) context.addIssue({ code: "custom", path: ["record"], message: "Choose the batch record." });
    if (values.subject.value === "rnd" && !values.batch) context.addIssue({ code: "custom", path: ["batch"], message: "Choose the trial batch." });
  });
type UseValues = z.input<typeof useSchema>;
const uses = [{ value: "production", label: "Production batch" }, { value: "rnd", label: "R&D trial batch" }] as const;
/** Links a use of water to the coverage in force at the time, for a production batch (and optionally its step) or an R&D trial batch. */
function UseDialog({ periods, onClose }: { periods: readonly Period[]; onClose: () => void }) {
  const [record] = routinesApi.useRecordWaterUseMutation();
  const write = useWrite();
  const form = useForm<UseValues>({ resolver: zodResolver(useSchema), defaultValues: { period: null, usedAt: new Date(), subject: uses[0], record: null, step: null, project: null, batch: null } });
  const subject = useWatch({ control: form.control, name: "subject" });
  const chosenRecord = useWatch({ control: form.control, name: "record" });
  const project = useWatch({ control: form.control, name: "project" });
  const period = useWatch({ control: form.control, name: "period" });
  void form.formState.errors;
  const [products] = useState(() => new Map<string, string>());
  const loadRecords = useBatchRecordOptions(products);
  const loadSteps = useStepOptions(chosenRecord ? products.get(chosenRecord.value) ?? null : null);
  const loadProjects = useRndProjectOptions();
  const loadBatches = useRndBatchOptions(project?.value ?? null);
  const recordId = chosenRecord?.value;
  useEffect(() => { form.setValue("step", null); }, [recordId, form]);
  const projectId = project?.value;
  useEffect(() => { form.setValue("batch", null); }, [projectId, form]);
  const coverage = periods.find((item) => item.id === period?.value);
  const production = subject.value === "production";
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "period", label: "Sampling point and coverage", required: true, options: periods.map((item) => ({ value: item.id, label: periodLabel(item) })) },
    { type: InputTypes.DATE, name: "usedAt", label: "Used on", required: true, fromYear: 2020, toYear: 2100,
      ...(coverage?.validFrom ? { minDate: new Date(coverage.validFrom) } : {}), description: "Within the coverage chosen." },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "subject", label: "Used for", required: true, options: uses },
    ...(production ? [
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "record", label: "Batch record", required: true, loadOptions: loadRecords, placeholder: "Choose the batch", searchPlaceholder: "Search batch numbers" } as const,
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "step", label: "Production step", loadOptions: loadSteps, placeholder: chosenRecord ? "Optional" : "Choose the batch first", disabled: !chosenRecord } as const,
    ] : [
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "project", label: "R&D project", loadOptions: loadProjects, placeholder: "Choose the project", searchPlaceholder: "Search projects" } as const,
      { type: InputTypes.SELECT, mode: "single", source: "async", name: "batch", label: "Trial batch", required: true, loadOptions: loadBatches, placeholder: project ? "Choose the batch" : "Choose the project first", disabled: !project } as const,
    ]),
  ] as const satisfies readonly WizardField<UseValues>[], [periods, coverage, production, loadRecords, loadSteps, chosenRecord, loadProjects, loadBatches, project]);
  const submit = form.handleSubmit((values) => write.run(() => record({ waterQualityPeriodId: values.period?.value ?? "", usedAt: values.usedAt.toISOString(),
    ...(values.subject.value === "production" ? { batchManufacturingRecordId: values.record?.value ?? "", ...(values.step ? { productionActivityStepId: values.step.value } : {}) } : { rndTrialBatchId: values.batch?.value ?? "" }) }),
  () => { toast.success("Water use recorded"); onClose(); }));
  return <Shell title="Record water use" description="Ties the batch to the approved coverage it used. Water stock itself is not changed." busy={write.busy} message={write.message} onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Record use">
    <FormWizard form={form} fields={fields} /></Shell>;
}

const holdSchema = z.object({ reason: z.string({ message: "Give the QA reason." }).trim().min(1, "Give the QA reason.") });
function HoldDialog({ period, onClose }: { period: Period; onClose: () => void }) {
  const [hold] = routinesApi.useHoldPeriodMutation();
  const write = useWrite();
  const form = useForm<z.infer<typeof holdSchema>>({ resolver: zodResolver(holdSchema), defaultValues: { reason: "" } });
  const submit = form.handleSubmit((values) => write.run(() => hold({ periodId: period.id, reason: values.reason.trim() }),
    (affected) => { toast.success(`Coverage held; ${String(affected ?? 0)} linked use${affected === 1 ? "" : "s"} affected`); onClose(); }));
  return <Shell destructive title={`Hold ${periodLabel(period)}?`} description="Holding stops new use from this sampling point and flags the batches that already used it." busy={write.busy} message={write.message}
    onClose={onClose} onSubmit={(event) => void submit(event)} submitLabel="Hold coverage">
    <FormWizard form={form} fields={[{ type: InputTypes.TEXTAREA, name: "reason", label: "QA reason", required: true, rows: 3 }]} /></Shell>;
}

const column = dataTableColumns<Period>();
/** Water quality coverage: which sampling points may be used, from approved water certificates, and every recorded use. */
export function WaterQualityPage() {
  const [params, setParams] = useSearchParams();
  const certificateId = params.get("certificateId");
  const query = routinesApi.useListPeriodsQuery(undefined);
  const [open, setOpen] = useState<"activate" | "use" | { hold: Period } | null>(certificateId ? "activate" : null);
  const active = useMemo(() => (query.data ?? []).filter((period) => period.status === WaterStatus.Active), [query.data]);
  const close = () => { setOpen(null); if (certificateId) setParams((current) => { const next = new URLSearchParams(current); next.delete("certificateId"); return next; }, { replace: true }); };
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.samplingPoint ?? "", { id: "point", header: "Sampling point", cell: ({ row }) => <span className="font-medium">{row.original.samplingPoint ?? "–"}</span> }),
    column.accessor((row) => row.validFrom ?? "", { id: "coverage", header: "Coverage", cell: ({ row }) => `${formatDate(row.original.validFrom) ?? "–"} – ${formatDate(row.original.validUntil) ?? "–"}` }),
    column.accessor("status", { header: "Status", size: 110, cell: ({ row }) => row.original.status === WaterStatus.Held ? <Badge variant="destructive">Held</Badge> : <Badge>Active</Badge> }),
    column.accessor("useRecordCount", { header: "Uses", size: 80 }),
    column.accessor((row) => row.holdReason ?? row.retrospectiveReason ?? "", { id: "note", header: "Note", cell: ({ row }) => <span className="line-clamp-2 break-words text-sm">{row.original.holdReason ? `Held: ${row.original.holdReason}` : row.original.retrospectiveReason ? `Retrospective: ${row.original.retrospectiveReason}` : "–"}</span> }),
    column.display({ id: "hold", size: 100, cell: ({ row }) => row.original.status === WaterStatus.Active ? <PermissionGuard require={routinePermissions.waterManage}>
      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setOpen({ hold: row.original })}>Hold</Button></PermissionGuard> : null }),
  ]), []);
  return <article className="min-w-0 space-y-4">
    <PageHeader title="Water quality coverage" crumbs={[{ label: "Routine tests", to: routinesPath }, { label: "Water quality" }]} actions={<PermissionGuard require={routinePermissions.waterManage}>
      <Button variant="outline" onClick={() => setOpen("activate")}>Activate coverage</Button><Button disabled={active.length === 0} onClick={() => setOpen("use")}>Record water use</Button></PermissionGuard>} />
    <ListDataTable label="Water quality coverage" columns={columns} rows={query.data ?? []} getRowId={(row) => row.id} loading={query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : null} emptyTitle="No coverage yet" emptyDescription="Activate coverage from an approved water certificate." />
    {open === "activate" ? <ActivateDialog certificateId={certificateId} onClose={close} /> : null}
    {open === "use" ? <UseDialog periods={active} onClose={close} /> : null}
    {open && typeof open === "object" ? <HoldDialog period={open.hold} onClose={close} /> : null}
  </article>;
}
