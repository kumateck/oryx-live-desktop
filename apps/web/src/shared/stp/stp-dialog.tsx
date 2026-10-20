import { StpVersionFile } from "./stp-version-file";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { documentLocked, documentProblem, documentStatusLabel, DocumentStatus, type StpDocument } from "./stp-document";

const schema = z.object({
  stpNumber: z.string({ message: "Enter the STP number." }).trim().min(1, "Enter the STP number."),
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(1, "Choose at least one."),
  description: z.string().nullish(),
  document: z.instanceof(File).nullish(),
  reasonForChange: z.string().nullish(),
});
export type StpDialogValues = z.infer<typeof schema>;

/**
 * Creating or editing an STP: its number, what it covers, and its controlled document. The first document is required;
 * a new file is added as the next version, and replacing an approved document needs a reason.
 */
export function StpDialog({ title, itemLabel, saved, linked, document, loadItems, suggestNumber, onSave, onClose }: {
  title: string; itemLabel: string;
  saved: { number: string; description: string | null } | null; linked: readonly SelectOption[]; document: StpDocument | null;
  loadItems: SelectLoader; suggestNumber: (() => Promise<string | null>) | null;
  /** Saves in order and resolves to an error message, or null when everything was saved. */ onSave: (values: StpDialogValues) => Promise<string | null>; onClose: () => void;
}) {
  const form = useForm<StpDialogValues>({ resolver: zodResolver(schema), defaultValues: { stpNumber: saved?.number ?? "", items: [...linked], description: saved?.description ?? "", document: null, reasonForChange: "" } });
  const file = useWatch({ control: form.control, name: "document" });
  void form.formState.errors;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const locked = documentLocked(document?.status);
  const approved = document?.status === DocumentStatus.Approved;

  useEffect(() => {
    if (!suggestNumber) return;
    let current = true;
    void suggestNumber().then((number) => { if (current && number && !form.getFieldState("stpNumber").isDirty) form.setValue("stpNumber", number); });
    return () => { current = false; };
  }, [suggestNumber, form]);

  const fields = useMemo(() => [
    { type: InputTypes.TEXT, name: "stpNumber", label: "STP number", required: true },
    { type: InputTypes.SELECT, mode: "multiple", source: "async", name: "items", label: itemLabel, required: true, loadOptions: loadItems, placeholder: "Select", searchPlaceholder: "Search",
      description: "Only items without an STP are offered." },
    { type: InputTypes.RICHTEXT, name: "description", label: "Description", rows: 3 },
    ...(locked ? [] : [{ type: InputTypes.UPLOAD, name: "document", mode: "single", label: document ? "Replace the document" : "STP document", accept: ".docx", required: !document,
      description: document ? "Leave empty to keep the current document. A new file becomes the next version." : "One .docx file. It becomes version 1 of the controlled document." } as const]),
    ...(approved && file ? [{ type: InputTypes.TEXT, name: "reasonForChange", label: "Reason for change", required: true, placeholder: "Why the approved document is being replaced" } as const] : []),
  ] as const satisfies readonly WizardField<StpDialogValues>[], [itemLabel, loadItems, locked, document, approved, file]);

  const submit = form.handleSubmit(async (values) => {
    const problem = documentProblem({ file: values.document ?? null, document, reasonForChange: values.reasonForChange ?? "" });
    if (problem) { form.setError(values.document && approved ? "reasonForChange" : "document", { message: problem }); return; }
    setBusy(true);
    setMessage("");
    const error = await onSave(values);
    setBusy(false);
    if (error) setMessage(error); else onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>An STP is kept for each item it covers; they share the number and the document is attached to each.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {document ? <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"><span>Current document</span>
            <Badge variant={document.status === DocumentStatus.Approved ? "default" : "secondary"}>{documentStatusLabel(document.status)}</Badge>
            {document.versions[0] ? <><span className="text-muted-foreground">version {document.versions[0].versionNumber}</span><StpVersionFile documentId={document.id} version={document.versions[0]} /></> : null}
            {locked ? <p className="w-full text-xs text-muted-foreground">The document is under review and cannot be replaced until the review is completed or rejected.</p> : null}</div> : null}
          <FormWizard form={form} fields={fields} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : saved ? "Save STP" : "Create STP"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
