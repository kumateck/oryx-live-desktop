import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { ardStageLabel, type ArdSource } from "../../lib/ard";
import { ardAttachmentTypes, ardFormSchema, type ArdFormValues, type SavedArd } from "../../schemas/ard-schema";

const fields = [
  { type: InputTypes.TEXT, name: "specNumber", label: "Specification number", required: true },
  { type: InputTypes.TEXTAREA, name: "description", label: "Description", rows: 3 },
  { type: InputTypes.UPLOAD, name: "attachments", label: "Attach files", mode: "multiple", accept: ardAttachmentTypes, description: "Images, PDF, Word, or Excel files." },
] as const satisfies readonly WizardField<ArdFormValues>[];

const safeLink = (link: string | null | undefined) => link && /^https?:\/\//i.test(link) ? link : null;

export type ArdTarget = { saved: SavedArd } | { source: ArdSource };

export function ArdDialog({ target, saving, message, onSave, onClose }: {
  target: ArdTarget;
  saving: boolean;
  message: string;
  onSave: (values: ArdFormValues, target: ArdTarget) => Promise<boolean>;
  onClose: () => void;
}) {
  const saved = "saved" in target ? target.saved : null;
  const facts = saved
    ? { stage: saved.stage, stp: saved.productStandardTestProcedure?.stpNumber ?? "", form: saved.form?.name ?? "" }
    : "source" in target ? { stage: target.source.stage, stp: target.source.stp.stpNumber, form: target.source.form.name } : null;
  const form = useForm<ArdFormValues>({ resolver: zodResolver(ardFormSchema), defaultValues: saved
    ? { specNumber: saved.specNumber, description: saved.description, attachments: [] }
    : { specNumber: "source" in target ? target.source.specNumber : "", description: "", attachments: [] } });
  const submit = form.handleSubmit(async (values) => { if (await onSave(values, target)) onClose(); });

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{saved ? "Edit" : "Add"} {facts ? ardStageLabel(facts.stage).toLowerCase() : ""} analytical raw data</DialogTitle>
        <DialogDescription>The stage, STP, and template form come from the product's STP and the specification for this stage.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="min-w-0 space-y-4">
        {facts ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
          <dt className="text-muted-foreground">Stage</dt><dd>{ardStageLabel(facts.stage)}</dd>
          <dt className="text-muted-foreground">STP number</dt><dd className="break-words">{facts.stp || "–"}</dd>
          <dt className="text-muted-foreground">Template form</dt><dd className="break-words">{facts.form || "–"}</dd>
        </dl> : null}
        <FormWizard form={form} fields={fields} />
        {saved?.attachments.length ? <div className="space-y-1 rounded-md border p-3 text-sm">
          <p className="font-medium">Files already attached</p>
          <ul className="space-y-1">{saved.attachments.map((file, index) => { const link = safeLink(file.link); return <li key={file.id ?? index} className="flex items-center gap-2">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
            {link ? <a className="min-w-0 break-words text-primary underline-offset-2 hover:underline" href={link} target="_blank" rel="noreferrer">{file.name || "Unnamed file"}</a>
              : <span className="min-w-0 break-words">{file.name || "Unnamed file"}</span>}
          </li>; })}</ul>
        </div> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : saved ? "Save changes" : "Add analytical raw data"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
