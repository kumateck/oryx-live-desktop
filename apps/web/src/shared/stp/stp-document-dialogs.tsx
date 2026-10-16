import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";

const signatureSchema = z.object({
  password: z.string({ message: "Enter your password." }).min(1, "Enter your password."),
  meaning: z.string({ message: "Say what you are signing for." }).trim().min(3, "Say what you are signing for."),
});
type SignatureValues = z.infer<typeof signatureSchema>;
const signatureFields = (placeholder: string): WizardField<SignatureValues>[] => [
  { type: InputTypes.PASSWORD, name: "password", label: "Your password", autoComplete: "current-password", required: true, description: "Your signature is made with your own password, now." },
  { type: InputTypes.TEXT, name: "meaning", label: "Meaning of the signature", required: true, placeholder },
];

/**
 * An electronic signature: the signer's password, entered at the moment of signing, and what the signature means.
 * `onSign` resolves to an error message, or null when signed; the password is cleared either way.
 */
export function SignatureDialog({ title, description, confirmLabel, placeholder, destructive = false, onSign, onClose }: {
  title: string; description: string; confirmLabel: string; placeholder: string; destructive?: boolean;
  onSign: (values: SignatureValues) => Promise<string | null>; onClose: () => void;
}) {
  const form = useForm<SignatureValues>({ resolver: zodResolver(signatureSchema), defaultValues: { password: "", meaning: "" } });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async (values) => {
    setBusy(true);
    setMessage("");
    const error = await onSign(values);
    setBusy(false);
    form.setValue("password", "");
    if (error) setMessage(error);
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4"><FormWizard form={form} fields={signatureFields(placeholder)} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={busy}>{busy ? <><Spinner />Signing…</> : confirmLabel}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

const reviseSchema = z.object({
  reasonForChange: z.string({ message: "Give the reason for the change." }).trim().min(3, "Give the reason for the change."),
  file: z.instanceof(File).nullish().refine((file) => !file || file.name.toLowerCase().endsWith(".docx"), "Choose a .docx file."),
});
type ReviseValues = z.infer<typeof reviseSchema>;
const reviseFields: WizardField<ReviseValues>[] = [
  { type: InputTypes.TEXT, name: "reasonForChange", label: "Reason for change", required: true, placeholder: "e.g. Update acceptance criteria for assay" },
  { type: InputTypes.UPLOAD, name: "file", mode: "single", label: "Replace with a new document", accept: ".docx", description: "Optional. Without a file, the new draft starts as a copy of the approved version." },
];

/** Starts a new draft of an approved document. The approved version stays in force until the draft is approved. */
export function ReviseDialog({ onRevise, onClose }: { onRevise: (values: { reasonForChange: string; file: File | null }) => Promise<string | null>; onClose: () => void }) {
  const form = useForm<ReviseValues>({ resolver: zodResolver(reviseSchema), defaultValues: { reasonForChange: "", file: null } });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = form.handleSubmit(async (values) => {
    setBusy(true);
    setMessage("");
    const error = await onRevise({ reasonForChange: values.reasonForChange, file: values.file ?? null });
    setBusy(false);
    if (error) setMessage(error);
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Start a new draft</DialogTitle>
        <DialogDescription>The document is approved and read-only. A new draft never changes the version in force; it takes over only once it is reviewed and approved.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-4"><FormWizard form={form} fields={reviseFields} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <><Spinner />Starting…</> : "Start draft"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
