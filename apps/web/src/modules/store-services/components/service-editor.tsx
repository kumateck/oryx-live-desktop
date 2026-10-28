import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import type { StoreService } from "@/shared/services/contracts";
import { serviceEditorSchema, type ServiceValues } from "../schemas/editor";
import { useServiceSave } from "../hooks/use-service-save";
const fields: WizardField<ServiceValues>[] = [
  { type: I.TEXT, name: "name", label: "Service name", required: true },
  { type: I.TEXT, name: "code", label: "Service code", required: true },
  { type: I.DATE, name: "start", label: "Start date", required: true },
  { type: I.DATE, name: "end", label: "End date", required: true },
  { type: I.TEXTAREA, name: "description", label: "Description" },
  {
    type: I.UPLOAD,
    name: "files",
    label: "Attach documents",
    mode: "multiple",
    accept: ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlsx",
    maxSizeBytes: 20 * 1024 * 1024,
  },
];
function CodeSuggestion({ apply }: { apply: (code: string) => void }) {
  const code = useGeneratedCode("Service");
  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        disabled={code.busy || !code.ready}
        onClick={() =>
          void code.suggest().then((v) => {
            if (v) apply(v);
          })
        }
      >
        {code.busy ? "Generating…" : "Suggest service code"}
      </Button>
      {code.unavailable ? <p className="text-muted-foreground">A code could not be generated. Enter it manually.</p> : null}
    </div>
  );
}
export function ServiceEditor({ original = null, onClose }: { original?: StoreService | null; onClose: () => void }) {
  const command = useServiceSave(original, onClose);
  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceEditorSchema),
    defaultValues: {
      name: original?.name ?? "",
      code: original?.code ?? "",
      description: original?.description ?? "",
      start: original ? new Date(original.startDate.slice(0, 10) + "T00:00:00") : null,
      end: original ? new Date(original.endDate.slice(0, 10) + "T00:00:00") : null,
      files: [],
    },
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{original ? "Edit service" : "Create service"}</DialogTitle>
          <DialogDescription>Define the service and its availability period. Files are attached after the service record is saved.</DialogDescription>
        </DialogHeader>
        <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={form.handleSubmit(command.run)}>
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed || !!command.savedId}>
              <FormWizard form={form} fields={fields} />
              {!original ? <CodeSuggestion apply={(code) => form.setValue("code", code, { shouldValidate: true })} /> : null}
            </fieldset>
            {command.error ? (
              <p role="alert" className="text-destructive">
                {command.error}
              </p>
            ) : null}
            {command.savedId ? (
              <Link className="underline" to={`/extrals/services/${encodeURIComponent(command.savedId)}`}>
                Inspect saved service and attachments
              </Link>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Close
            </Button>
            <Button disabled={command.busy || !command.allowed || !!command.savedId}>{command.busy ? "Saving…" : "Save service"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
