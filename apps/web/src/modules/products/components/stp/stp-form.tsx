import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import type { ProductStpState } from "../../hooks/use-product-stp";
import { documentLocked, documentProblem, documentStatus } from "../../lib/stp";
import { stpFormSchema, type StpFormValues } from "../../schemas/stp-schema";
import { StpDocumentStatus } from "./stp-document-status";

const empty = { document: null, reasonForChange: "" } as const;

export function StpForm({ state }: { state: ProductStpState }) {
  const { stp, document, suggestNumber } = state;
  const form = useForm<StpFormValues>({ resolver: zodResolver(stpFormSchema), defaultValues: { stpNumber: stp?.stpNumber ?? "", description: stp?.description ?? "", ...empty } });
  const locked = documentLocked(document?.status ?? null);
  const approved = document?.status === documentStatus.approved;

  // A new STP starts with the next number in the series; the user can change it.
  const isNew = !stp;
  useEffect(() => {
    if (!isNew) return;
    let current = true;
    void suggestNumber().then((number) => { if (current && number && !form.getFieldState("stpNumber").isDirty) form.setValue("stpNumber", number); });
    return () => { current = false; };
  }, [isNew, suggestNumber, form]);

  const fields = useMemo(() => [
    { type: InputTypes.TEXT, name: "stpNumber", label: "STP number", required: true },
    ...(locked ? [] : [{ type: InputTypes.UPLOAD, name: "document", label: document ? "Replace the document" : "STP document", mode: "single", accept: ".docx",
      required: !document, description: "One .docx file." } as const]),
    ...(approved ? [{ type: InputTypes.TEXT, name: "reasonForChange", label: "Reason for change",
      description: "Needed when replacing an approved document." } as const] : []),
    { type: InputTypes.RICHTEXT, name: "description", label: "Summary", placeholder: "Optional short summary", rows: 6, className: "lg:col-span-2 lg:row-span-3 lg:col-start-2 lg:row-start-1" },
  ] satisfies readonly WizardField<StpFormValues>[], [locked, approved, document]);

  const submit = form.handleSubmit(async (values) => {
    const problem = documentProblem({ file: values.document ?? null, document, reasonForChange: values.reasonForChange ?? "" });
    if (problem === "reason") { form.setError("reasonForChange", { message: "Say why the approved document is being replaced" }); return; }
    if (problem) { form.setError("document", { message: problem }); return; }
    const saved = await state.save(values);
    // After a full save the form starts again from what was saved, with no file chosen.
    if (saved) form.reset({ stpNumber: values.stpNumber, description: values.description ?? "", ...empty });
  });

  return <form noValidate onSubmit={(event) => void submit(event)} className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={form.formState.isDirty && !state.saving} />
    <StpDocumentStatus document={document} />
    <FormWizard form={form} fields={fields} className="lg:grid-cols-3" />
    {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
    <div className="flex justify-end">
      <Button type="submit" disabled={state.saving}>{state.saving ? <><Spinner />Saving…</> : stp ? "Save changes" : "Create STP"}</Button>
    </div>
  </form>;
}
