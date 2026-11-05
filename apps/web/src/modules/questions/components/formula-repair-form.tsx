import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { ExpressionView } from "@/shared/formula/ui/math/expression-view";
import { formulaRepairDefaults } from "../lib/formula-repair";
import { useFormulaRepair } from "../hooks/use-formula-repair";
import { repairTestKey, type FormulaRepairValues, type RepairContext, type RepairProblem } from "../schemas/formula-repair-schema";
import { FormulaRepairHistory } from "./formula-repair-history";
import { FormulaRepairReceipt } from "./formula-repair-receipt";
import { FormulaRepairReview } from "./formula-repair-review";

const fields: WizardField<FormulaRepairValues>[] = [
  { type: InputTypes.TEXTAREA, name: "expression", label: "Corrected expression", required: true, rows: 3 },
];
const problemTitles: Record<RepairProblem["kind"], string> = {
  denied: "Not allowed", stale: "Preview again", invalid: "Repair not possible yet", unconfirmed: "Repair not confirmed",
};

export function FormulaRepairForm({ context, atr, field, refresh }: { context: RepairContext; atr: string | null; field: string | null; refresh: () => void }) {
  const page = useFormulaRepair(context, atr, field, refresh);
  const { form, preview, problem } = page;
  if (page.receipt) return <FormulaRepairReceipt receipt={page.receipt} questionId={context.questionId} fromTest={Boolean(atr)} onBack={page.back} />;
  return <form noValidate onSubmit={page.submit("preview")} className="min-w-0 space-y-4">
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">1. Correct the configuration</h2>
      <div className="max-w-full overflow-x-auto"><ExpressionView expression={formulaRepairDefaults(context.definition).expression} print /></div>
      <p className="text-sm text-muted-foreground">Used by {context.formsUsingQuestion} forms · {context.responsesAffected} existing responses. Existing tests keep their configuration unless selected below.</p>
      {context.blockers.map(text => <p key={text} role="alert" className="text-sm text-destructive">{text}</p>)}
      <FormWizard form={form} fields={fields} />
      {page.manualKeys.length ? <fieldset className="space-y-2"><legend className="text-sm font-medium">Manual inputs required by this expression</legend>
        <div className="grid gap-3 sm:grid-cols-2">{page.manualKeys.map(key => <label key={key} className="space-y-1 text-sm">
          <span>:{key} — input label</span><Input {...form.register(`labels.${key}`)} placeholder={key} disabled={page.busy} maxLength={200} />
        </label>)}</div></fieldset> : null}
    </section>
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">2. Choose what to repair</h2>
      <Controller control={form.control} name="updateQuestion" render={({ field: input }) => <label className="flex items-start gap-2 text-sm">
        <Checkbox checked={input.value} disabled={!context.canRepairQuestion || page.busy} onCheckedChange={checked => input.onChange(checked === true)} />
        <span>Repair the shared question for templates and future tests{context.canRepairQuestion ? null : <span className="block text-muted-foreground">Requires the repair question formula permission.</span>}</span></label>} />
      <Controller control={form.control} name="selectedTests" render={({ field: input }) => <fieldset className="space-y-2"><legend className="text-sm font-medium">Open tests you are assigned to</legend>
        {context.tests.length === 0 ? <p className="text-sm text-muted-foreground">No saved test responses are accessible to you for this question. Save a draft first if a test has not started.</p> : null}
        {context.tests.map(test => { const key = repairTestKey(test); return <label key={key} className="flex items-start gap-2 text-sm">
          <Checkbox checked={input.value.includes(key)} disabled={!context.canRepairTests || !test.eligible || page.busy}
            onCheckedChange={checked => input.onChange(checked === true ? [...input.value, key] : input.value.filter(value => value !== key))} />
          <span className="min-w-0 break-words">{test.label}{test.blocker ? <span className="block text-muted-foreground">{test.blocker}</span> : null}</span>
        </label>; })}</fieldset>} />
    </section>
    {preview ? <FormulaRepairReview preview={preview} form={form} updateQuestion={form.getValues("updateQuestion")} /> : null}
    {problem ? <div role="alert" className="space-y-1 rounded-lg border border-destructive/40 p-3 text-sm">
      <p className="font-medium text-destructive">{problemTitles[problem.kind]}</p><p className="break-words">{problem.message}</p></div> : null}
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" disabled={page.busy} onClick={page.back}>Cancel</Button>
      <Button type="submit" variant={preview ? "outline" : "default"} disabled={page.busy || context.blockers.length > 0}>{page.busy && !page.applying ? <Spinner /> : null}Preview repair</Button>
      <Button type="button" disabled={page.busy || !page.canApply} onClick={page.submit("apply")}>{page.applying ? <Spinner /> : null}{problem?.kind === "unconfirmed" ? "Retry apply" : "Apply repair"}</Button>
    </div>
    <FormulaRepairHistory questionId={context.questionId} />
  </form>;
}
