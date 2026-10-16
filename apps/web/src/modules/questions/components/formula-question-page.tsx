import { Controller } from "react-hook-form";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import TheAduseiFormula from "@/shared/formula/ui/types/expression";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useFormulaQuestion } from "../hooks/use-formula-question";
import { questionPermissions, questionsPath } from "../lib/questions";
import { formulaTypeOptions, type QuestionFormulaValues } from "../schemas/formula-question-schema";
import { DraftFormulaChecks } from "./formula-checks";
import { FormulaRevisionPanel } from "./formula-revision-panel";
import { VariableScopeFields } from "./variable-scope-fields";

const fields: WizardField<QuestionFormulaValues>[] = [
  { type: InputTypes.TEXT, name: "label", label: "Question", required: true, placeholder: "e.g. Assay" },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "formulaType", label: "Formula type", required: true, options: formulaTypeOptions },
  { type: InputTypes.TEXT, name: "reference", label: "Reference", placeholder: "Optional reference" },
  { type: InputTypes.TEXTAREA, name: "description", label: "Default answer", rows: 3, placeholder: "Optional default answer" },
];

function FormulaQuestion({ questionId }: { questionId: string | null }) {
  const page = useFormulaQuestion(questionId);
  const { form } = page;
  if (page.loading) return <FormPageSkeleton label="Loading formula question" />;
  if (page.loadError) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Question unavailable</h1>
    <p className="text-sm text-muted-foreground">{page.loadError}</p><div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={page.retry}>Retry</Button><Button size="sm" onClick={page.back}>Questions</Button></div></div>;
  const expressionError = form.formState.errors.expression?.message;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={questionId ? `Edit ${page.title ?? "formula question"}` : "New formula question"} crumbs={[{ label: "Questions", to: questionsPath }, { label: questionId ? page.title ?? "Formula question" : "New formula question" }]}
      actions={<PermissionGuard require={questionId ? questionPermissions.edit : questionPermissions.create}>
        {page.locked ? <span className="text-sm text-muted-foreground">This revision is in review and cannot be changed.</span> : null}
        <Button type="button" variant="outline" onClick={page.back}>Cancel</Button>
        <Button type="submit" form="formula-question" disabled={page.saving || page.locked}>{page.saving ? <><Spinner />Saving…</> : questionId ? "Save draft" : "Create formula question"}</Button>
      </PermissionGuard>} />
    <form id="formula-question" noValidate onSubmit={page.save} className="space-y-4 rounded-lg border bg-card p-4">
      <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      <div className="space-y-1.5"><p className="text-sm font-medium">Formula <span className="text-destructive">*</span></p>
        <div className={expressionError ? "rounded-md ring-1 ring-destructive" : undefined}>
          <Controller control={form.control} name="expression" render={({ field }) => <TheAduseiFormula key={page.type} type={page.type} value={field.value} disabled={page.locked}
            onChange={(next) => field.onChange(next)} onUniversalPayloadChange={page.onUniversal} />} /></div>
        {expressionError ? <p role="alert" className="text-sm text-destructive">{expressionError}</p> : null}</div>
      <VariableScopeFields form={form} definition={page.definition} preset={page.preset} />
      <DraftFormulaChecks definition={page.definition} preset={page.preset} onProblem={page.onProblem} />
      {page.message ? <p role="alert" className="text-sm text-destructive">{page.message}</p> : null}
    </form>
    {questionId ? <FormulaRevisionPanel questionId={questionId} saved={page.saved} onStatus={page.onStatus} onSubmitted={page.back} /> : null}
  </article>;
}

export function FormulaQuestionPage() {
  const { id } = useParams();
  return <FormulaQuestion key={id ?? "new"} questionId={id ?? null} />;
}
