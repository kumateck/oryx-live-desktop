import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";

const { usePostApiV1QaOosInvestigationsInitiateMutation } = analyticalApi;
export const oosPermission = "CanInitiateOosInvestigation";
const oosAudit = { module: "Quality Assurance", subModule: "OOS Investigations" } as const;

const schema = z.object({
  coaNumber: z.string().trim().min(1, "Enter the certificate number"),
  productOrMaterialName: z.string().trim().max(500).optional(),
  batchNumber: z.string().trim().max(200).optional(),
  rejectionReason: z.string().trim().min(1, "Say why the results were rejected").max(4000, "Keep the reason under 4,000 characters"),
});
type Values = z.infer<typeof schema>;
const fields = [
  { type: InputTypes.TEXT, name: "coaNumber", label: "Certificate number", required: true },
  { type: InputTypes.TEXT, name: "productOrMaterialName", label: "Product or material" },
  { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number" },
  { type: InputTypes.TEXTAREA, name: "rejectionReason", label: "Reason the results were rejected", required: true },
] as const satisfies readonly WizardField<Values>[];

export interface OosSubject {
  kind: "material" | "product"; materialBatchId: string | null; analyticalTestRequestId: string | null;
  coaNumber: string | null; name: string | null; batchNumber: string | null; reason: string | null;
}

/**
 * Starts an out-of-specification investigation on rejected results. The server also puts a material
 * batch back in quarantine, or a product's test request back to testing, so the dialog says so first.
 */
export function StartOosDialog({ subject, onClose }: { subject: OosSubject; onClose: () => void }) {
  const [initiate] = usePostApiV1QaOosInvestigationsInitiateMutation();
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    coaNumber: subject.coaNumber ?? "", productOrMaterialName: subject.name ?? "", batchNumber: subject.batchNumber ?? "", rejectionReason: subject.reason ?? "" } });
  const busy = form.formState.isSubmitting;
  const effect = subject.kind === "material"
    ? "The material batch is put back in quarantine until the investigation is closed."
    : subject.analyticalTestRequestId ? "The product's test request goes back to testing." : "No test request was found for this product step, so none is reopened.";
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await initiate({ ...oosAudit, domainEntitiesOosInvestigationsInitiateOosInvestigationRequest: {
      materialBatchId: subject.materialBatchId, analyticalTestRequestId: subject.analyticalTestRequestId, coaNumber: values.coaNumber,
      productOrMaterialName: values.productOrMaterialName || null, batchNumber: values.batchNumber || null, rejectionReason: values.rejectionReason } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    // The investigation itself is worked on in the web app until Quality Assurance moves to the desktop app.
    toast.success("OOS investigation started", { description: "Continue it under QA, OOS investigations, in the web app." });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Start an OOS investigation</DialogTitle>
        <DialogDescription>{effect} The server does not check for an investigation already open on these results, so start one only once.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3">
          <FormWizard form={form} fields={fields} />
          {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={busy}>{busy ? <><Spinner />Starting…</> : "Start investigation"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
