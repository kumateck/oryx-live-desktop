import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{saved ? "Edit" : "Add"} {facts ? ardStageLabel(facts.stage).toLowerCase() : ""} analytical raw data</DialogTitle>
        <DialogDescription>The stage, STP, and template form come from the product's STP and the specification for this stage.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4">
          {facts ? <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">Stage</dt><dd>{ardStageLabel(facts.stage)}</dd>
            <dt className="text-muted-foreground">STP number</dt><dd className="break-words">{facts.stp || "–"}</dd>
            <dt className="text-muted-foreground">Template form</dt><dd className="break-words">{facts.form || "–"}</dd>
          </dl> : null}
          <FormWizard form={form} fields={fields} />
          {saved?.attachments.length ? <AttachmentList title="Files already attached" files={saved.attachments.map((file, index) => ({ id: file.id ?? `attachment-${index}`, name: file.name || "Unnamed file", link: file.link ?? null }))} /> : null}
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : saved ? "Save changes" : "Add analytical raw data"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
