import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { ProductSpecificationsState, SpecificationTarget } from "../../hooks/use-product-specifications";
import { ardStageLabel } from "../../lib/ard";
import { earliestRevisionDate } from "../../lib/specification";
import { specificationFormSchema, type SpecificationFormValues } from "../../schemas/specification-schema";

/** A saved date under its form field name, or nothing when the saved value is missing or unreadable. */
function savedDate<TName extends "effectiveDate" | "reviewDate">(name: TName, value: string | null | undefined): Partial<Record<TName, Date>> {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? { [name]: parsed } as Record<TName, Date> : {};
}
const years = { fromYear: 2000, toYear: 2100 } as const;

export function SpecificationDialog({ target, state, onClose }: { target: SpecificationTarget; state: ProductSpecificationsState; onClose: () => void }) {
  const saved = "saved" in target ? target.saved : null;
  const stage = "saved" in target ? target.saved.testStage : target.stage;
  const form = useForm<SpecificationFormValues>({ resolver: zodResolver(specificationFormSchema), defaultValues: saved ? {
    specificationNumber: saved.specificationNumber, revisionNumber: saved.revisionNumber, supersedesNumber: saved.supersedesNumber, description: saved.description,
    ...savedDate("effectiveDate", saved.effectiveDate), ...savedDate("reviewDate", saved.reviewDate), ...(saved.form?.id ? { form: { value: saved.form.id, label: saved.form.name } } : {}),
  } : { specificationNumber: "", revisionNumber: "", supersedesNumber: "", description: "" } });
  const effectiveDate = useWatch({ control: form.control, name: "effectiveDate" });
  const earliest = useMemo(() => earliestRevisionDate(effectiveDate), [effectiveDate]);

  // A new specification starts with the next number in its series; the user can change it.
  const newStage = "stage" in target ? target.stage : null;
  const suggestNumber = state.suggestNumber;
  useEffect(() => {
    if (newStage === null) return;
    let current = true;
    void suggestNumber(newStage).then((number) => { if (current && number && !form.getFieldState("specificationNumber").isDirty) form.setValue("specificationNumber", number); });
    return () => { current = false; };
  }, [newStage, suggestNumber, form]);

  const loadTemplates = state.loadTemplates;
  const fields = useMemo(() => [
    { type: InputTypes.TEXT, name: "specificationNumber", label: "Specification number", required: true },
    { type: InputTypes.TEXT, name: "revisionNumber", label: "Revision", required: true },
    { type: InputTypes.DATE, name: "effectiveDate", label: "Effective date", required: true, ...years },
    { type: InputTypes.DATE, name: "reviewDate", label: "Revision date", required: true, minDate: earliest, ...years, description: "After the effective date and after today." },
    { type: InputTypes.TEXT, name: "supersedesNumber", label: "Supersedes", required: true, placeholder: "The number this replaces, or None" },
    { type: InputTypes.SELECT, name: "form", label: "Template", mode: "single", source: "async", loadOptions: loadTemplates, required: true,
      placeholder: "Select a template", searchPlaceholder: "Search templates", description: "The form the tests for this stage are recorded on." },
    { type: InputTypes.RICHTEXT, name: "description", label: "Notes", rows: 4, className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<SpecificationFormValues>[], [earliest, loadTemplates]);

  const submit = form.handleSubmit(async (values) => { if (await state.save(values, target)) onClose(); });

  return <Dialog open onOpenChange={(open) => { if (!open && !state.saving) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>{saved ? "Edit" : "Add"} {ardStageLabel(stage).toLowerCase()} specification</DialogTitle>
        <DialogDescription>{saved ? "A specification number shared by several products is updated for all of them."
          : "The specification's test parameters are filled in by Quality Control after it is created."}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
          {state.message ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={state.saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={state.saving}>{state.saving ? <><Spinner />Saving…</> : saved ? "Save changes" : "Add specification"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
