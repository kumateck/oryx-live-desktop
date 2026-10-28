import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { questionSchema } from "@/shared/form-response/form-model";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { TableQuestionBuilder } from "@/shared/questions/table-question-builder";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1FormQuestionByQuestionIdQuery, usePostApiV1FormQuestionMutation, usePutApiV1FormQuestionByQuestionIdMutation } from "../api/questions-api";
import { questionPermissions, questionsAudit, questionsPath } from "../lib/questions";
import { tableQuestionDefaults, tableQuestionRequest, tableQuestionSchema, type TableQuestionValues } from "../schemas/table-question-schema";

const fields: WizardField<TableQuestionValues>[] = [
  { type: InputTypes.TEXT, name: "label", label: "Question", required: true, placeholder: "e.g. Weights of 20 tablets" },
  { type: InputTypes.RICHTEXT, name: "description", label: "Default answer" },
];

function TableQuestion({ questionId }: { questionId: string | null }) {
  const navigate = useNavigate();
  const query = useGetApiV1FormQuestionByQuestionIdQuery(questionId ? { ...questionsAudit, questionId } : skipToken);
  const question = useMemo(() => { const parsed = questionSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const [create, creating] = usePostApiV1FormQuestionMutation();
  const [update, updating] = usePutApiV1FormQuestionByQuestionIdMutation();
  const require = questionId ? questionPermissions.edit : questionPermissions.create;
  const permission = usePermissionAction(require);
  const [message, setMessage] = useState("");
  const form = useForm<TableQuestionValues>({ resolver: zodResolver(tableQuestionSchema), defaultValues: tableQuestionDefaults(null) });
  useEffect(() => { if (question) form.reset(tableQuestionDefaults(question)); }, [form, question]);
  const saving = creating.isLoading || updating.isLoading;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const body = tableQuestionRequest(values);
    const result = questionId ? await update({ ...questionsAudit, questionId, domainEntitiesFormsRequestCreateQuestionRequest: body }) : await create({ ...questionsAudit, domainEntitiesFormsRequestCreateQuestionRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(questionId ? "Table question updated" : "Table question added");
    void navigate(questionsPath);
  });
  if (questionId && query.isLoading) return <FormPageSkeleton label="Loading table question" />;
  if (questionId && !question) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Question unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a question the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button size="sm" onClick={() => void navigate(questionsPath)}>Questions</Button></div></div>;
  const definitionError = form.formState.errors.definition?.message;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={questionId ? `Edit ${question?.label ?? "table question"}` : "New table question"} crumbs={[{ label: "Questions", to: questionsPath }, { label: question?.label ?? "New table question" }]}
      actions={<PermissionGuard require={require}><Button type="button" variant="outline" onClick={() => void navigate(questionsPath)}>Cancel</Button>
        <Button type="submit" form="table-question" disabled={saving}>{saving ? <><Spinner />Saving…</> : questionId ? "Save table question" : "Create table question"}</Button></PermissionGuard>} />
    <form id="table-question" noValidate onSubmit={(event) => void submit(event)} className="space-y-4 rounded-lg border bg-card p-4">
      <FormWizard form={form} fields={fields} />
      <div className="space-y-1.5"><p className="text-sm font-medium">Table <span className="text-destructive">*</span></p>
        <Controller control={form.control} name="definition" render={({ field }) => <TableQuestionBuilder value={field.value} onChange={field.onChange} require={require} />} />
        {definitionError ? <p role="alert" className="text-sm text-destructive">{definitionError}</p> : null}</div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    </form>
  </article>;
}

export function TableQuestionPage() {
  const { id } = useParams();
  return <TableQuestion key={id ?? "new"} questionId={id ?? null} />;
}
