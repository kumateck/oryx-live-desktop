import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { AttachmentOpener } from "@/shared/attachments/attachment-opener";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
const uploadApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadRetestEvidence: build.mutation<void, { instanceId: string; reference: string; file: File }>({
    query: ({ instanceId, reference, file }) => {
      const body = new FormData(); body.append("file", file, file.name);
      return { url: `/api/v1/qc/worksheets/instances/${encodeURIComponent(instanceId)}/files/${encodeURIComponent(reference)}`, method: "POST", body, headers: { Module: "Quality Control", SubModule: "QC Retests" } };
    },
  }),
  readRetestEvidence: build.mutation<Blob, { instanceId: string; reference: string }>({
    query: ({ instanceId, reference }) => ({ url: `/api/v1/qc/worksheets/instances/${encodeURIComponent(instanceId)}/files/${encodeURIComponent(reference)}`, responseHandler: (response: Response) => response.blob(), headers: { Module: "Quality Control", SubModule: "QC Retests" } }),
  }),
}) });
const schema = z.object({ file: z.instanceof(File).nullable().refine((file): boolean => file !== null && file.size > 0 && file.size <= 16 * 1024 * 1024, "Choose a file up to 16 MB") });
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [{ type: InputTypes.UPLOAD, mode: "single", name: "file", label: "Worksheet evidence file", maxSizeBytes: 16 * 1024 * 1024 }];
export function WorksheetAttachment({ instanceId, reference }: { instanceId: string; reference: string }) {
  const [read] = uploadApi.useReadRetestEvidenceMutation();
  return <AttachmentOpener file={{ id: reference, name: reference.split("__").at(-1) ?? reference, link: null, read: async () => read({ instanceId, reference }).unwrap() }} />;
}
export function WorksheetFileField({ id, instanceId, fieldKey, value, disabled, require, onChange }: {
  id: string; instanceId: string; fieldKey: string; value: string; disabled: boolean; require: string; onChange: (reference: string) => void;
}) {
  const [upload, uploading] = uploadApi.useUploadRetestEvidenceMutation();
  const gate = usePermissionAction(require);
  const [error, setError] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { file: null } });
  const save = form.handleSubmit(async ({ file }) => {
    if (!file) return;
    const denied = gate.check(); if (denied) { setError(denied); return; }
    const reference = `${fieldKey.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 45)}-${crypto.randomUUID()}__${file.name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-100)}`;
    const result = await upload({ instanceId, reference, file });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    onChange(reference); form.reset({ file: null }); setError("");
  });
  return <div id={id} className="space-y-2">
    {value ? <WorksheetAttachment instanceId={instanceId} reference={value} /> : null}
    {!disabled ? <><FormWizard form={form} fields={fields} /><Button type="button" size="sm" variant="outline" disabled={uploading.isLoading || !gate.allowed} onClick={() => void save()}>Upload evidence</Button></> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </div>;
}
