import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { servicesApi } from "@/shared/api/generated/services";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { jobAudit, jobKeys, jobOrderAudit, jobRequestSchema, sameJob, type JobRequest } from "../lib/job-requests";
import { useJobPickers } from "./use-job-pickers";

const option = z.object({ value: z.string(), label: z.string() });
const day = (v: Date | null | undefined) => (v ? new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())).toISOString() : null);
const fromIso = (v: string | null) => (v ? new Date(v) : null);

/** Re-reads the job request and says what stops an action that depended on how it looked when opened. */
export function useFreshJob() {
  const [read] = servicesApi.useLazyGetApiV1JobRequestsByIdQuery();
  return async (job: JobRequest): Promise<string | null> => {
    const fresh = await read({ ...jobAudit, id: job.id }, false);
    if (fresh.error) return apiErrorMessage(fresh.error);
    const parsed = jobRequestSchema.safeParse(fresh.data);
    return parsed.success && sameJob(job, parsed.data) ? null : "This job request changed after you opened it. Close this and check it again.";
  };
}

const editorSchema = z.object({
  code: z.string().trim().min(1, "Enter the job request number"), issued: z.date({ error: "Enter the date of issue" }).nullable().refine((v): boolean => v !== null, "Enter the date of issue"),
  wantedBy: z.date({ error: "Enter the preferred completion date" }).nullable().refine((v): boolean => v !== null, "Enter the preferred completion date"),
  site: option.nullable(), equipment: option.nullable(), equipmentNumber: z.string(), instrument: z.string(), instrumentNumber: z.string(), service: option.nullable(),
  description: z.string().trim().min(1, "Describe the work"),
}).refine((v) => !v.issued || !v.wantedBy || v.wantedBy >= v.issued, { path: ["wantedBy"], message: "The completion date cannot be before the date of issue" });
type EditorValues = z.infer<typeof editorSchema>;

/** Raises a job request for the user's department, or edits one that work has not started on. */
export function JobRequestEditor({ job, onClose, onSaved }: { job: JobRequest | null; onClose: () => void; onSaved: (id: string) => void }) {
  const pickers = useJobPickers();
  const permission = usePermissionAction(job ? jobKeys.edit : jobKeys.create);
  const code = useGeneratedCode("JobRequest");
  const fresh = useFreshJob();
  const [create, creating] = servicesApi.usePostApiV1JobRequestsMutation();
  const [update, updating] = servicesApi.usePutApiV1JobRequestsByIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<EditorValues>({ resolver: zodResolver(editorSchema), defaultValues: job ? {
    code: job.code, issued: fromIso(job.issued), wantedBy: fromIso(job.wantedBy), site: job.site ? { value: job.site.id, label: job.site.name } : null,
    equipment: job.equipment ? { value: job.equipment.id, label: job.equipment.name } : null, equipmentNumber: job.equipmentNumber ?? "", instrument: job.instrument ?? "",
    instrumentNumber: job.instrumentNumber ?? "", service: job.service ? { value: job.service.id, label: job.service.name } : null, description: job.description ?? "",
  } : { code: "", issued: new Date(), wantedBy: null, site: null, equipment: null, equipmentNumber: "", instrument: "", instrumentNumber: "", service: null, description: "" } });
  const suggested = useRef(false);
  useEffect(() => {
    if (job || !code.ready || suggested.current) return;
    suggested.current = true;
    void code.suggest().then((next) => { if (next && !form.getValues("code")) form.setValue("code", next, { shouldValidate: true }); });
  }, [code, form, job]);
  const fields: WizardField<EditorValues>[] = [
    { type: InputTypes.TEXT, name: "code", label: "Job request number", required: true, ...(job ? { disabled: true } : {}) },
    { type: InputTypes.DATE, name: "issued", label: "Date of issue", required: true, ...(job ? { disabled: true } : {}) },
    { type: InputTypes.DATE, name: "wantedBy", label: "Preferred completion date", required: true },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "site", label: "Site", options: pickers.sites, placeholder: "Choose a site" },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "equipment", label: "Equipment", options: pickers.equipment, placeholder: "Choose equipment" },
    { type: InputTypes.TEXT, name: "equipmentNumber", label: "Equipment number" },
    { type: InputTypes.TEXT, name: "instrument", label: "Instrument" },
    { type: InputTypes.TEXT, name: "instrumentNumber", label: "Instrument number" },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "service", label: "Service", loadOptions: pickers.services, placeholder: "Search for a service", className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description of work", required: true, rows: 4, className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={job ? `Edit ${job.code}` : "Raise a job request"} description="Work needed by your department, done in-house or by an external provider."
    form={form} fields={fields} saving={creating.isLoading || updating.isLoading} message={message} submitLabel={job ? "Save job request" : "Raise job request"} onClose={onClose}
    onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check();
      if (denied) { setMessage(denied); return; }
      if (job) { const stale = await fresh(job); if (stale) { setMessage(stale); return; } }
      const common = { siteId: values.site?.value ?? null, equipmentId: values.equipment?.value ?? null, serviceId: values.service?.value ?? null,
        equipmentInstrumentNumber: values.equipmentNumber.trim() || null, item: values.instrument.trim() || null, itemNumber: values.instrumentNumber.trim() || null,
        descriptionOfWork: values.description.trim(), preferredCompletionDate: day(values.wantedBy) ?? "" };
      const result = job
        ? await update({ ...jobAudit, id: job.id, domainEntitiesJobRequestsUpdateJobRequestRequest: common })
        : await create({ ...jobAudit, domainEntitiesJobRequestsCreateJobRequest: { ...common, code: values.code.trim(), dateOfIssue: day(values.issued) ?? "" } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success(job ? "Job request updated" : "Job request raised", { description: job ? undefined : "It goes for approval before work is assigned." });
      onSaved(job?.id ?? (typeof result.data === "string" ? result.data : ""));
    }} />;
}

const assignSchema = z.object({ employee: option.nullable().refine((v): boolean => v !== null, "Choose who does the work"), notes: z.string() });
type AssignValues = z.infer<typeof assignSchema>;

/** Assigns an approved job request to an employee, who is notified. */
export function AssignDialog({ job, onClose }: { job: JobRequest; onClose: () => void }) {
  const user = useCurrentUser();
  const pickers = useJobPickers();
  const permission = usePermissionAction(jobKeys.assign);
  const fresh = useFreshJob();
  const [assign, assigning] = servicesApi.usePostApiV1JobRequestsAssignInternalMutation();
  const [message, setMessage] = useState("");
  const form = useForm<AssignValues>({ resolver: zodResolver(assignSchema), defaultValues: { employee: null, notes: "" } });
  const fields: WizardField<AssignValues>[] = [
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "employee", label: "Assign to", required: true, loadOptions: pickers.employees, placeholder: "Search for an employee", className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 3, className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={`Assign ${job.code}`} description="The employee must have an active account; they are told about the assignment." form={form} fields={fields}
    saving={assigning.isLoading} message={message} submitLabel="Assign" onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check(); if (denied) { setMessage(denied); return; }
      const stale = await fresh(job); if (stale) { setMessage(stale); return; }
      // The server records the signed-in user as the assigner whatever is sent.
      const result = await assign({ ...jobAudit, domainEntitiesJobRequestsAssignInternalJobRequest: { jobRequestId: job.id, assignedToEmployeeId: values.employee?.value ?? "", assignedById: user?.id ?? "", notes: values.notes.trim() || null } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Job assigned"); onClose();
    }} />;
}

const reassignSchema = z.object({ employee: option.nullable().refine((v): boolean => v !== null, "Choose who takes over"), reason: z.string().trim().min(3, "Give the reason"), notes: z.string() });
type ReassignValues = z.infer<typeof reassignSchema>;

/** Hands assigned work that has not started to another employee. */
export function ReassignDialog({ job, onClose }: { job: JobRequest; onClose: () => void }) {
  const pickers = useJobPickers();
  const permission = usePermissionAction(jobKeys.assign);
  const fresh = useFreshJob();
  const [loadExecutions] = servicesApi.useLazyGetApiV1JobExecutionsQuery();
  const [reassign, reassigning] = servicesApi.usePostApiV1JobExecutionsReassignMutation();
  const [message, setMessage] = useState("");
  const form = useForm<ReassignValues>({ resolver: zodResolver(reassignSchema), defaultValues: { employee: null, reason: "", notes: "" } });
  const fields: WizardField<ReassignValues>[] = [
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "employee", label: "Reassign to", required: true, loadOptions: pickers.employees, placeholder: "Search for an employee", className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "reason", label: "Reason", required: true, rows: 2, className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "notes", label: "Notes", rows: 2, className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={`Reassign ${job.code}`} description={`Currently with ${job.assignee?.name ?? "nobody"}.`} form={form} fields={fields}
    saving={reassigning.isLoading} message={message} submitLabel="Reassign" onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check(); if (denied) { setMessage(denied); return; }
      const stale = await fresh(job); if (stale) { setMessage(stale); return; }
      const executions = await loadExecutions({ ...jobAudit, jobRequestId: job.id, page: 1, pageSize: 10 }, false);
      const execution = (executions.data?.data ?? []).find((e) => e.id && e.completedAt == null);
      if (!execution?.id) { setMessage(executions.error ? apiErrorMessage(executions.error) : "The work assigned for this request could not be found."); return; }
      if (values.employee?.value === job.assignee?.id) { setMessage("Choose someone other than the current assignee."); return; }
      const result = await reassign({ ...jobAudit, domainEntitiesJobRequestsReassignJobExecutionRequest: { jobExecutionId: execution.id, newEmployeeId: values.employee?.value ?? "", reason: values.reason.trim(), notes: values.notes.trim() || null } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Job reassigned"); onClose();
    }} />;
}

const completeSchema = z.object({ activity: z.string().trim().min(3, "Say what was done") });
type CompleteValues = z.infer<typeof completeSchema>;

/** The assigned employee records what was done and completes the job. */
export function CompleteDialog({ job, onClose }: { job: JobRequest; onClose: () => void }) {
  const permission = usePermissionAction(jobKeys.complete);
  const fresh = useFreshJob();
  const [complete, completing] = servicesApi.usePostApiV1JobRequestsCompleteMutation();
  const [message, setMessage] = useState("");
  const form = useForm<CompleteValues>({ resolver: zodResolver(completeSchema), defaultValues: { activity: "" } });
  const fields: WizardField<CompleteValues>[] = [{ type: InputTypes.TEXTAREA, name: "activity", label: "Activity performed", required: true, rows: 4, className: "md:col-span-2" }];
  return <SettingsFormDialog title={`Complete ${job.code}`} description="Only the employee the job is assigned to can complete it." form={form} fields={fields}
    saving={completing.isLoading} message={message} submitLabel="Complete job" onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check(); if (denied) { setMessage(denied); return; }
      const stale = await fresh(job); if (stale) { setMessage(stale); return; }
      const result = await complete({ ...jobAudit, domainEntitiesJobRequestsCompleteJobRequestRequest: { jobRequestId: job.id, activityPerformedNote: values.activity.trim(), notes: values.activity.trim() } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Job completed"); onClose();
    }} />;
}

const orderSchema = z.object({
  service: option.nullable(), issued: z.date().nullable().refine((v): boolean => v !== null, "Enter the date of issue"), description: z.string(),
  providers: z.array(option).min(1, "Choose at least one service provider"),
});
type OrderValues = z.infer<typeof orderSchema>;

/** Sends an approved job request out to service providers as a job order. */
export function JobOrderDialog({ job, onClose, onCreated }: { job: JobRequest; onClose: () => void; onCreated: (id: string) => void }) {
  const user = useCurrentUser();
  const pickers = useJobPickers();
  const permission = usePermissionAction({ kind: "all", permissions: [jobKeys.viewOrders, jobKeys.createOrder] });
  const fresh = useFreshJob();
  const [create, creating] = servicesApi.usePostApiV1JobOrdersMutation();
  const [message, setMessage] = useState("");
  const form = useForm<OrderValues>({ resolver: zodResolver(orderSchema), defaultValues: { service: job.service ? { value: job.service.id, label: job.service.name } : null, issued: new Date(), description: job.description ?? "", providers: [] } });
  const fields: WizardField<OrderValues>[] = [
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "service", label: "Service", loadOptions: pickers.services, placeholder: "Search for a service" },
    { type: InputTypes.DATE, name: "issued", label: "Date of issue", required: true },
    { type: InputTypes.SELECT, mode: "multiple", source: "async", name: "providers", label: "Service providers", required: true, loadOptions: pickers.providers(job.service?.id ?? null), placeholder: "Search for providers", className: "md:col-span-2" },
    { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3, className: "md:col-span-2" },
  ];
  return <SettingsFormDialog title={`Create a job order for ${job.code}`} description="The job order is sent to each chosen provider for a quotation. Your signature on file is added." form={form} fields={fields}
    saving={creating.isLoading} message={message} submitLabel="Create job order" onClose={onClose} onSubmit={async (values) => {
      setMessage("");
      const denied = permission.check(); if (denied) { setMessage(denied); return; }
      const stale = await fresh(job); if (stale) { setMessage(stale); return; }
      // The server records the signed-in user as the issuer and adds their signature.
      const result = await create({ ...jobOrderAudit, domainEntitiesJobRequestsCreateJobOrderRequest: { jobRequestId: job.id, serviceId: values.service?.value ?? null,
        issuedDate: day(values.issued) ?? "", issuedById: user?.id ?? "", description: values.description.trim() || null, serviceProviderIds: values.providers.map((p) => p.value) } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
      toast.success("Job order created and sent to providers"); onCreated(typeof result.data === "string" ? result.data : "");
    }} />;
}
