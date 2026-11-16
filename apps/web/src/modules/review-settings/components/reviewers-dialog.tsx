import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useSettingsDirectories } from "@/modules/settings-support/directory";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useSaveReviewSettingsMutation } from "@/shared/reviews/review-api";
import type { ReviewConfiguration, ReviewDocumentType } from "@/shared/reviews/review-schema";
import { reviewersDefaults, reviewersFormSchema, reviewersPayload, type ReviewersValues } from "../schemas/reviewers-schema";

export const editReviewSettings = "CanEditDocumentReviewSettings";

/** Names the roles and people who review one document type. Any one of them, or the record's preparer, may confirm a review. */
export function ReviewersDialog({ type, configuration, onClose }: { type: ReviewDocumentType; configuration: ReviewConfiguration | undefined; onClose: () => void }) {
  const directory = useSettingsDirectories();
  const permission = usePermissionAction(editReviewSettings);
  const [save, mutation] = useSaveReviewSettingsMutation();
  const [error, setError] = useState("");
  const form = useForm<ReviewersValues>({ resolver: zodResolver(reviewersFormSchema), defaultValues: reviewersDefaults(configuration) });
  const fields: WizardField<ReviewersValues>[] = [
    { type: InputTypes.SELECT, name: "roles", label: "Roles", mode: "multiple", source: "sync", options: directory.roles, placeholder: directory.loading ? "Loading…" : "Anyone with these roles" },
    { type: InputTypes.SELECT, name: "users", label: "People", mode: "multiple", source: "sync", options: directory.users, placeholder: directory.loading ? "Loading…" : "These people" },
  ];
  const submit = form.handleSubmit(async (values) => {
    setError("");
    if (directory.error) { setError(directory.error); return; }
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    const result = await save(reviewersPayload(type.itemType, values));
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success("Reviewers saved", { description: type.label });
    onClose();
  });
  const saving = mutation.isLoading;
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Reviewers of {type.label.toLowerCase()}s</DialogTitle>
      <DialogDescription>Each new {type.label.toLowerCase()} waits for one of these to confirm it is checked before it goes for approval. Whoever prepared it may also confirm.</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-3">
        <FormWizard form={form} fields={fields} />
        {error || !permission.allowed ? <p role="alert" className="break-words text-sm text-destructive">{error || permissionDeniedMessage}</p> : null}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving || !permission.allowed || directory.loading}>{saving ? <><Spinner />Saving…</> : "Save reviewers"}</Button>
      </DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
