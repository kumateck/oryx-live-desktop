import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { employeeApi, type Employee } from "../api/employee-api";
import { EmployeeType, employeeAudit, employeeDetailsPath, employeePermissions, employeeTypeLabels } from "../lib/access";
import { employeeFormValues } from "../lib/employee-payload";
import { employeeSchema, emptyEmployee, type EmployeeValues } from "../schemas/employee-schema";
import { useEmployeeSave } from "../hooks/use-employee-save";
import { EmployeeFormSections } from "./employee-form-sections";
function Editor({ original, type }: { original: Employee | null; type: EmployeeType }) {
  const navigate = useNavigate(); const access = useAccess(); const [snapshot] = useState(original);
  const form = useForm<EmployeeValues>({ resolver: zodResolver(employeeSchema), defaultValues: snapshot ? employeeFormValues(snapshot) : emptyEmployee() });
  const save = useEmployeeSave(snapshot, type, (id) => { if (access.has(employeePermissions.details)) void navigate(employeeDetailsPath(id)); else form.reset(emptyEmployee()); });
  return <article className="space-y-5"><PageHeader title={`${original ? "Edit" : "Register"} ${employeeTypeLabels[type].toLowerCase()} employee`} crumbs={[{ label: "Human resources" }, { label: "Employee management", to: "/hr/employee-management" }, { label: original ? "Edit" : "Register" }]} />
    {original ? <AttachmentList title="Existing photographs and attachments" files={(original.attachments ?? []).flatMap((file) => file.id && file.name ? [{ id: file.id, name: file.name, link: file.link ?? null }] : [])} /> : null}
    <form noValidate className="space-y-5" onSubmit={form.handleSubmit(save.save)}>
      <fieldset disabled={save.busy || !save.allowed || Boolean(save.savedId)}><EmployeeFormSections form={form} /></fieldset>
      {Object.keys(form.formState.errors).length ? <p role="alert" className="text-destructive">Check the highlighted fields before saving.</p> : null}
      {save.error ? <p role="alert" className="text-destructive">{save.error}</p> : null}
      {save.savedId ? <p role="status">The employee profile is saved.{access.has(employeePermissions.details) ? <> <Link className="underline" to={employeeDetailsPath(save.savedId)}>View saved employee</Link></> : null}</p> : null}
      <div className="flex flex-wrap gap-3">{!save.complete ? <Button disabled={save.busy || !save.allowed}>{save.busy ? "Saving…" : save.savedId ? "Retry photograph upload" : "Save employee"}</Button> : null}<Button type="button" variant="outline" disabled={save.busy} onClick={() => void navigate("/hr/employee-management")}>Back to employees</Button></div>
    </form>
  </article>;
}
function ExistingEditor({ id, type }: { id: string; type: EmployeeType }) {
  const query = employeeApi.useGetApiV1EmployeeByIdQuery({ ...employeeAudit, id });
  if (query.isLoading) return <DetailPageSkeleton label="Loading employee" groups={4} />;
  if (query.error || !query.currentData) return <div role="alert"><p>{query.error ? apiErrorMessage(query.error) : "Employee not found"}</p><Button onClick={() => void query.refetch()}>Retry employee</Button></div>;
  if (query.currentData.type !== type) return <p role="alert">The route's employment type differs from the employee record. Open the editor from employee details.</p>;
  return <Editor original={query.currentData} type={type} />;
}
export function EmployeeEditorPage() {
  const { id, type } = useParams(); const kind = type === "0" ? EmployeeType.Casual : type === "1" ? EmployeeType.Permanent : null;
  if (kind === null) return <p role="alert">Choose a valid employment type.</p>;
  return id ? <ExistingEditor key={id} id={id} type={kind} /> : <Editor key={kind} original={null} type={kind} />;
}
