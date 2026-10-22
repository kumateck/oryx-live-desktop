import { useRef, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { overtimeAudit, overtimeRoot, overtimeDetail, overtimeDuration, OvertimeStatus, type Overtime } from "../lib/overtime";
import { overtimeSchema, overtimeDefaults, type OvertimeValues } from "../schemas/overtime-schema";
import { useOvertimeLookups } from "../hooks/use-overtime-lookups";
import { useOvertimeSave } from "../hooks/use-overtime-save";
function Editor({ original }: { original: Overtime | null }) {
  const [evidence] = useState(original);
  const navigate = useNavigate();
  const code = useGeneratedCode("OvertimeRequest");
  const form = useForm<OvertimeValues>({ resolver: zodResolver(overtimeSchema), defaultValues: overtimeDefaults(evidence) });
  const [department, start, end] = useWatch({ control: form.control, name: ["department", "start", "end"] });
  const previous = useRef(department?.value);
  useEffect(() => {
    if (previous.current !== department?.value) {
      previous.current = department?.value;
      form.setValue("employees", [], { shouldValidate: true });
    }
  }, [department?.value, form]);
  const load = useOvertimeLookups(department?.value);
  const save = useOvertimeSave(evidence, (id) => {
    void navigate(overtimeDetail(id));
  });
  const fields: WizardField<OvertimeValues>[] = [
    {
      type: I.TEXT,
      name: "code",
      label: "Request code",
      required: true,
      readOnly: Boolean(evidence),
      description: "A suggested code is not reserved; the server checks it when saved.",
    },
    { type: I.DATE, name: "date", label: "Overtime date", required: true },
    { type: I.CLOCK, name: "start", label: "Starts", required: true },
    { type: I.CLOCK, name: "end", label: "Ends", required: true },
    {
      type: I.SELECT,
      name: "department",
      label: "Department",
      mode: "single",
      source: "async",
      loadOptions: (search, page, signal) => load("department", search, page, signal),
      required: true,
    },
    {
      type: I.SELECT,
      name: "employees",
      label: "Employees",
      mode: "multiple",
      source: "async",
      loadOptions: (search, page, signal) => load("employee", search, page, signal),
      required: true,
      disabled: !department?.value,
      description: "Active members of the selected department and its child departments are offered and rechecked before saving.",
    },
    { type: I.RICHTEXT, name: "justification", label: "Justification", className: "sm:col-span-2" },
  ];
  const suggest = async () => {
    const value = await code.suggest();
    if (value) form.setValue("code", value, { shouldValidate: true, shouldDirty: true });
  };
  return (
    <section className="space-y-4">
      <PageHeader
        title={evidence ? "Edit pending overtime request" : "Request overtime"}
        crumbs={[{ label: "Overtime management", to: overtimeRoot }, { label: evidence ? "Edit request" : "New request" }]}
      />
      <p className="text-sm text-muted-foreground">
        Overtime uses the existing approval workflow. Times must end later on the same calendar day; the current server does not calculate overnight overtime
        correctly.
      </p>
      {!evidence ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={save.busy || code.busy || !code.ready || !save.allowed} onClick={() => void suggest()}>
            Suggest request code
          </Button>
          {code.unavailable ? <p className="text-sm text-muted-foreground">Code suggestion is unavailable. Enter a unique code.</p> : null}
        </div>
      ) : null}
      <form noValidate onSubmit={form.handleSubmit(save.save)} className="space-y-4">
        <fieldset disabled={save.busy || !save.allowed}>
          <FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        </fieldset>
        {overtimeDuration(start, end) !== null ? <p className="text-sm">Requested duration: {overtimeDuration(start, end)?.toLocaleString()} hours.</p> : null}
        {save.error ? (
          <p role="alert" className="text-sm text-destructive">
            {save.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={save.busy} asChild>
            <Link to={evidence?.id ? overtimeDetail(evidence.id) : overtimeRoot}>Back</Link>
          </Button>
          <Button disabled={save.busy || !save.allowed}>{save.busy ? "Saving…" : evidence ? "Save pending request" : "Submit for approval"}</Button>
        </div>
      </form>
    </section>
  );
}
function Edit({ id }: { id: string }) {
  const query = hrApi.useGetApiV1OvertimeRequestsByIdQuery({ ...overtimeAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading overtime request" groups={3} />;
  if (query.error || query.currentData?.id !== id) return <p role="alert">{query.error ? apiErrorMessage(query.error) : "This request is unavailable."}</p>;
  if (query.currentData.status !== OvertimeStatus.Pending)
    return (
      <p role="alert">
        Only a pending request can be edited. <Link to={overtimeDetail(id)}>View request</Link>
      </p>
    );
  return <Editor key={id} original={query.currentData} />;
}
export function OvertimeEditorPage() {
  const { id } = useParams();
  return id ? <Edit key={id} id={id} /> : <Editor original={null} />;
}
