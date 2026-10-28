import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { identityApi } from "@/shared/api/generated/identity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { fileDataUrl, imageDataBytes, verifyStoredImage } from "@/shared/images/stored-image";
import { bumpAvatarVersion } from "./avatar-version";
import { sameOriginAvatar } from "./session-api";

export const avatarLimit = 2 * 1024 * 1024;
const audit = { module: "Settings", subModule: "Account" };
const schema = z.object({ image: z.instanceof(File, { message: "Choose a photo" }).nullable()
  .refine((file) => Boolean(file), "Choose a photo")
  .refine((file) => !file || ["image/png", "image/jpeg", "image/webp"].includes(file.type) && file.size > 0 && file.size <= avatarLimit, "Choose a PNG, JPEG or WebP image up to 2 MiB") });
type Values = z.infer<typeof schema>;
const fields = [{ type: InputTypes.IMAGE, name: "image", label: "New photo", maxSizeBytes: avatarLimit, previewFit: "cover", description: "PNG, JPEG or WebP · up to 2 MiB." }] as const satisfies readonly WizardField<Values>[];
const profileSchema = z.object({ id: z.string(), avatar: z.string().nullish() });

/**
 * Replaces the signed-in user's photo. The server can fail and still answer 204, so the photo is read back
 * and compared before it is reported as saved, and only then does the rest of the app show it.
 */
export function AvatarForm({ userId, onSaved }: { userId: string; onSaved: () => Promise<void> }) {
  const [upload] = identityApi.usePostApiV1UserAvatarByIdMutation();
  const [read] = identityApi.useLazyGetApiV1UserAuthenticatedQuery();
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { image: null } });
  const busy = form.formState.isSubmitting;
  const submit = form.handleSubmit(async ({ image }) => {
    if (!image || controller.current) return;
    const current = new AbortController(); controller.current = current;
    setError("");
    try {
      const data = await fileDataUrl(image, current.signal, "photo");
      const bytes = imageDataBytes(data, avatarLimit, "photo");
      const response = await upload({ ...audit, id: userId, sharedRequestsUploadFileRequest: { file: data } });
      if ("error" in response) throw new Error(apiErrorMessage(response.error));
      const profile = await read(audit, false);
      if ("error" in profile) throw new Error(apiErrorMessage(profile.error));
      const parsed = profileSchema.safeParse(profile.data);
      if (!parsed.success || parsed.data.id !== userId) throw new Error("The server did not return your profile safely.");
      await verifyStoredImage(sameOriginAvatar(parsed.data.avatar), bytes, { Module: audit.module, SubModule: audit.subModule }, current.signal, "photo");
      bumpAvatarVersion();
      await onSaved();
      form.reset({ image: null });
      toast.success("Photo saved");
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : "The photo could not be saved. Try again.");
    } finally { controller.current = null; }
  });
  return <form noValidate className="space-y-3 rounded-lg border bg-card p-4" onSubmit={(event) => { event.preventDefault(); void submit(event); }}>
    <h2 className="text-sm font-semibold">Photo</h2>
    <fieldset disabled={busy}><FormWizard form={form} fields={fields} /></fieldset>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <Button type="submit" size="sm" disabled={busy}>{busy ? <><Spinner />Saving and checking…</> : "Save photo"}</Button>
  </form>;
}
