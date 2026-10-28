import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { isChoiceQuestion, QuestionType } from "@/shared/questions/question-types";
import { usePostApiV1FormQuestionMutation, usePutApiV1FormQuestionByQuestionIdMutation } from "../api/questions-api";
import { questionPermissions, questionsAudit, standardTypes, typeOption } from "../lib/questions";
import { newOption, questionDefaults, questionFormSchema, questionRequest, type QuestionFormValues, type QuestionRow } from "../schemas/question-schema";

/** Adds or edits a standard question: its wording, type, reference and, for choice questions, the answers offered. */
export function QuestionDialog({ question, onClose }: { question: QuestionRow | null; onClose: () => void }) {
  const [create, creating] = usePostApiV1FormQuestionMutation();
  const [update, updating] = usePutApiV1FormQuestionByQuestionIdMutation();
  const permission = usePermissionAction(question ? questionPermissions.edit : questionPermissions.create);
  const [message, setMessage] = useState("");
  const form = useForm<QuestionFormValues>({ resolver: zodResolver(questionFormSchema), defaultValues: questionDefaults(question) });
  const options = useFieldArray({ control: form.control, name: "options", keyName: "key" });
  const typeValue = Number(useWatch({ control: form.control, name: "type" })?.value);
  const choice = isChoiceQuestion(typeValue);
  const instrument = typeValue === QuestionType.Instrument;
  useEffect(() => { if (instrument) form.setValue("isMultiSelect", true); else if (!choice) form.setValue("isMultiSelect", false); }, [choice, form, instrument]);
  const fields = useMemo<WizardField<QuestionFormValues>[]>(() => [
    { type: InputTypes.TEXT, name: "label", label: "Question", required: true, placeholder: "e.g. Description of the sample" },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "type", label: "Question type", required: true, options: standardTypes.map(typeOption) },
    { type: InputTypes.TEXT, name: "reference", label: "Reference", placeholder: "Optional reference code" },
    { type: InputTypes.SWITCH, name: "isMultiSelect", label: "Allow more than one answer", disabled: !choice || instrument, description: instrument ? "Instrument questions always take one or more instruments." : choice ? "" : "Only choice questions offer this." },
    { type: InputTypes.TEXTAREA, name: "description", label: "Guidance", rows: 3, placeholder: "Optional guidance for the analyst", className: "md:col-span-2" },
  ], [choice, instrument]);
  const saving = creating.isLoading || updating.isLoading;
  const optionError = form.formState.errors.options?.message ?? form.formState.errors.options?.root?.message;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const body = questionRequest(values);
    const result = question ? await update({ ...questionsAudit, questionId: question.id, domainEntitiesFormsRequestCreateQuestionRequest: body })
      : await create({ ...questionsAudit, domainEntitiesFormsRequestCreateQuestionRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(question ? "Question updated" : "Question added");
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{question ? `Edit ${question.label}` : "Add a question"}</DialogTitle><DialogDescription>Questions are reused in form templates and answered by analysts.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {choice ? <fieldset className="space-y-2 rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><legend className="text-sm font-medium">Answer options</legend>
            <Button type="button" size="sm" variant="outline" onClick={() => options.append(newOption(`Option ${String(options.fields.length + 1)}`))}><Plus />Add option</Button></div>
            <ol className="space-y-2">{options.fields.map((option, index) => <li key={option.key} className="flex items-center gap-2"><span className="w-6 text-xs text-muted-foreground">{index + 1}.</span>
              <Input aria-label={`Option ${String(index + 1)}`} {...form.register(`options.${index}.name`)} />
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove option ${String(index + 1)}`} onClick={() => options.remove(index)}><Trash2 className="text-destructive" /></Button></li>)}</ol>
            {optionError ? <p role="alert" className="text-sm text-destructive">{optionError}</p> : null}
          </fieldset> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : question ? "Save question" : "Add question"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
