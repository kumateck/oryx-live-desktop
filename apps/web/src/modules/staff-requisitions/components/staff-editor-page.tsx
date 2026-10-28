import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { staffAudit, staffRoot, staffDetail, mayChangeStaff, appointments, budgets, type StaffRequest } from "../lib/staff";
import { staffSchema, staffDefaults, type StaffValues } from "../schemas/staff-schema";
import { useStaffLookups } from "../hooks/use-staff-lookups";
import { useStaffCommand } from "../hooks/use-staff-command";
function Editor({ original }: { original: StaffRequest | null }) {
  const [evidence] = useState(original);
  const navigate = useNavigate();
  const form = useForm<StaffValues>({ resolver: zodResolver(staffSchema), defaultValues: staffDefaults(evidence) });
  const department = useWatch({ control: form.control, name: "department" });
  const previous = useRef(department?.value);
  const load = useStaffLookups(department?.value);
  useEffect(() => {
    if (previous.current !== department?.value) {
      previous.current = department?.value;
      form.setValue("designation", null, { shouldValidate: true });
    }
  }, [department?.value, form]);
  const command = useStaffCommand(evidence, "save", (id) => {
    void navigate(staffDetail(id));
  });
  const fields: WizardField<StaffValues>[] = [
    { type: I.NUMBER, name: "staff", label: "Number of employees", min: 1, step: 1, required: true },
    {
      type: I.SELECT,
      name: "department",
      label: "Requesting department",
      mode: "single",
      source: "async",
      loadOptions: (search, page, signal) => load("department", search, page, signal),
      required: true,
    },
    {
      type: I.SELECT,
      name: "designation",
      label: "Job title",
      mode: "single",
      source: "async",
      loadOptions: (search, page, signal) => load("designation", search, page, signal),
      disabled: !department?.value,
      required: true,
    },
    { type: I.TEXT, name: "qualification", label: "Job qualification", required: true },
    { type: I.TEXT, name: "education", label: "Educational qualification", required: true },
    {
      type: I.SELECT,
      name: "appointment",
      label: "Appointment type",
      mode: "single",
      source: "sync",
      options: appointments.map((label, value) => ({ value: String(value), label })),
      required: true,
    },
    {
      type: I.SELECT,
      name: "budget",
      label: "Budget status",
      mode: "single",
      source: "sync",
      options: budgets.map((label, value) => ({ value: String(value), label })),
      required: true,
    },
    {
      type: I.DATE,
      name: "urgency",
      label: "Required by (end of day)",
      required: true,
      description: "New requests can be required by today or a later date. Existing timestamps are preserved when the date is unchanged.",
    },
    { type: I.RICHTEXT, name: "justification", label: "Justification", className: "sm:col-span-2" },
    { type: I.RICHTEXT, name: "requirements", label: "Additional requirements", className: "sm:col-span-2" },
    {
      type: I.RICHTEXT,
      name: "additionalRequests",
      label: "Other requests",
      className: "sm:col-span-2",
      description: "Kept separately from the additional requirements.",
    },
  ];
  return (
    <section className="space-y-4">
      <PageHeader
        title={evidence ? "Edit staff requisition" : "Request employees"}
        crumbs={[{ label: "Staff requisitions", to: staffRoot }, { label: evidence ? "Edit request" : "New request" }]}
      />
      <p className="text-sm text-muted-foreground">
        The server submits new requests through the existing staff requisition approval workflow. Approved or closed requests cannot be changed here.
      </p>
      <form
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          await command.run(values);
        })}
        className="space-y-4"
      >
        <fieldset disabled={command.busy || !command.allowed}>
          <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        </fieldset>
        {command.error ? (
          <p role="alert" className="text-sm text-destructive">
            {command.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={command.busy} asChild>
            <Link to={evidence?.id ? staffDetail(evidence.id) : staffRoot}>Back</Link>
          </Button>
          <Button disabled={command.busy || !command.allowed}>{command.busy ? "Saving…" : evidence ? "Save request details" : "Submit for approval"}</Button>
        </div>
      </form>
    </section>
  );
}
function Edit({ id }: { id: string }) {
  const query = hrApi.useGetApiV1StaffRequisitionsByIdQuery({ ...staffAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading staff requisition" groups={3} />;
  if (query.error || query.currentData?.id !== id) return <p role="alert">{query.error ? apiErrorMessage(query.error) : "This request is unavailable."}</p>;
  if (!mayChangeStaff(query.currentData))
    return (
      <p role="alert">
        This request is closed or approved. <Link to={staffDetail(id)}>View details</Link>
      </p>
    );
  return <Editor key={id} original={query.currentData} />;
}
export function StaffEditorPage() {
  const { id } = useParams();
  return id ? <Edit key={id} id={id} /> : <Editor original={null} />;
}
