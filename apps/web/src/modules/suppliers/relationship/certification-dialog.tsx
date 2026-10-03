import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { certificationTypes } from "./certification-types";
import { formDate, utcBoundary } from "@/shared/format/date-boundary";
import { useCreateCertificationMutation, useUpdateCertificationMutation } from "./relationship-api";
import { certificationSchema, type CertificationValues } from "./schemas";
import type { Certification, CertificationRequest } from "./types";

const options = certificationTypes.map((label, index) => ({ value: String(index), label }));
const certificationTypeValues: readonly CertificationRequest["certificationType"][] = [0, 1, 2, 3, 4];

export function CertificationDialog({ supplierId, record, open, onOpenChange }: {
  supplierId: string; record?: Certification; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [create, creating] = useCreateCertificationMutation();
  const [update, updating] = useUpdateCertificationMutation();
  const [error, setError] = useState("");
  const permission = usePermissionAction("CanManageSupplierCertifications");
  const form = useForm<CertificationValues>({ resolver: zodResolver(certificationSchema), defaultValues: {
    certificationType: record ? options[record.certificationType] ?? null : null,
    certificateNumber: record?.certificateNumber ?? "", issuingBody: record?.issuingBody ?? "",
    issueDate: formDate(record?.issueDate) ?? new Date(), expiryDate: formDate(record?.expiryDate),
  } });
  const fields = [
    { type: InputTypes.SELECT, name: "certificationType", label: "Type", mode: "single", source: "sync", options, required: true },
    { type: InputTypes.TEXT, name: "certificateNumber", label: "Certificate number", required: true },
    { type: InputTypes.TEXT, name: "issuingBody", label: "Issuing body", required: true, className: "sm:col-span-2" },
    { type: InputTypes.DATE, name: "issueDate", label: "Issued", required: true },
    { type: InputTypes.DATE, name: "expiryDate", label: "Expires", required: true },
  ] as const satisfies readonly WizardField<CertificationValues>[];
  const busy = creating.isLoading || updating.isLoading;
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      if (!values.certificationType || !values.expiryDate) return;
      const type = certificationTypeValues.find((value) => String(value) === values.certificationType?.value);
      if (type === undefined) { setError("Choose a valid certification type."); return; }
      const body: CertificationRequest = {
        certificationType: type,
        certificateNumber: values.certificateNumber, issuingBody: values.issuingBody,
        issueDate: utcBoundary(values.issueDate), expiryDate: utcBoundary(values.expiryDate, true),
      };
      const result = record ? await update({ supplierId, id: record.id, body }) : await create({ supplierId, body });
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      toast.success(record ? "Certification updated" : "Certification added"); onOpenChange(false);
    })();
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>{record ? "Edit certification" : "Add certification"}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => void save(event)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={busy || !permission.allowed}>{busy ? <><Spinner />Saving…</> : "Save certification"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
