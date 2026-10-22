import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard } from "@/shared/forms/form-wizard";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { leaveApi } from "../api/leave-api";
import { leaveAudit, categories, detailPath, leaveRoot, mayEdit, type Category, type Leave } from "../lib/leave";
import { leaveSchema, leaveDefaults, type LeaveValues } from "../schemas/leave-schema";
import { useLeaveLookups } from "../hooks/use-leave-lookups";
import { useLeaveSave } from "../hooks/use-leave-save";
import { leaveFields } from "./leave-fields";
import { leaveFiles } from "./leave-record";
function Editor({ category, original }: { category: Category; original: Leave | null }) {
  const [evidence] = useState(original);
  const navigate = useNavigate();
  const form = useForm<LeaveValues>({ resolver: zodResolver(leaveSchema), defaultValues: leaveDefaults(category, evidence) });
  const employee = useWatch({ control: form.control, name: "employee" });
  const query = leaveApi.useGetApiV1EmployeeByIdQuery({ ...leaveAudit, id: employee?.value ?? "" }, { skip: !employee?.value });
  const load = useLeaveLookups(query.currentData?.designation?.id);
  const save = useLeaveSave(evidence, (id) => {
    void navigate(detailPath(id));
  });
  return (
    <section className="space-y-4">
      <PageHeader
        title={`${evidence ? "Edit" : "Request"} ${categories[category].toLocaleLowerCase()}`}
        crumbs={[{ label: "Leave management", to: leaveRoot }, { label: evidence ? "Edit request" : "New request" }]}
      />
      <p className="text-sm text-muted-foreground">
        {evidence
          ? "This changes request details. A rejected request must be reapplied separately to restart review."
          : "Saving submits this request to the existing server approval workflow. Leave entitlements are determined by the server."}
      </p>
      <form noValidate onSubmit={form.handleSubmit(save.save)} className="space-y-4">
        <fieldset disabled={save.busy || !save.allowed || Boolean(save.savedId)}>
          <FormWizard form={form} fields={leaveFields(category, Boolean(evidence), load)} className="sm:grid-cols-2" />
        </fieldset>
        {save.error ? (
          <p role="alert" className="text-sm text-destructive">
            {save.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={save.busy} asChild>
            <Link to={evidence?.id ? detailPath(evidence.id) : leaveRoot}>{save.savedId ? "View saved request" : "Back"}</Link>
          </Button>
          <Button disabled={save.busy || !save.allowed}>
            {save.busy ? "Saving…" : save.savedId ? "Retry attachments only" : evidence ? "Save request details" : "Submit request"}
          </Button>
        </div>
      </form>
      {evidence ? <AttachmentList title="Existing attachments" files={leaveFiles(evidence)} /> : null}
    </section>
  );
}
function Edit({ id }: { id: string }) {
  const query = leaveApi.useGetApiV1LeaveRequestByIdQuery({ ...leaveAudit, id }, { refetchOnMountOrArgChange: true });
  if (query.isLoading) return <DetailPageSkeleton label="Loading leave request" groups={3} />;
  if (query.error || query.currentData?.id !== id || query.currentData.requestCategory === undefined)
    return <p role="alert">{query.error ? apiErrorMessage(query.error) : "This leave request is unavailable."}</p>;
  if (!mayEdit(query.currentData))
    return (
      <p role="alert">
        This request cannot be edited in its current state. <Link to={detailPath(id)}>View details</Link>
      </p>
    );
  return <Editor key={id} category={query.currentData.requestCategory} original={query.currentData} />;
}
export function LeaveEditorPage() {
  const { id, category } = useParams();
  if (id) return <Edit key={id} id={id} />;
  const parsed = z.enum(["0", "1", "2", "3"]).safeParse(category);
  if (!parsed.success) return <p role="alert">Choose a leave request category from leave management.</p>;
  const value: Category = parsed.data === "0" ? 0 : parsed.data === "1" ? 1 : parsed.data === "2" ? 2 : 3;
  return <Editor key={value} category={value} original={null} />;
}
