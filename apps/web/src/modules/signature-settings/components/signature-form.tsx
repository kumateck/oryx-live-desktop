import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useSaveSignature } from "../hooks/use-save-signature";
import { emptySignature, signatureLimit, signatureSchema, type SignatureValues } from "../schemas/signature-schema";

const drawing: readonly WizardField<SignatureValues>[] = [{ type: InputTypes.SIGNATURE, name: "drawing", label: "Signature", required: true, description: "Use the pointer to draw, or choose Type for a keyboard alternative." }];
const typing: readonly WizardField<SignatureValues>[] = [{ type: InputTypes.TEXT, name: "name", label: "Signature name", required: true, description: "Your name is converted into a signature image when saved." }];
const uploading: readonly WizardField<SignatureValues>[] = [{ type: InputTypes.IMAGE, name: "image", label: "Signature image", required: true, maxSizeBytes: signatureLimit, previewFit: "contain", description: "PNG, JPEG, or WebP · Maximum 2 MiB." }];
export function SignatureForm({ userId, storedPath }: { userId: string; storedPath: string | null }) {
  const form = useForm<SignatureValues>({ resolver: zodResolver(signatureSchema), defaultValues: emptySignature });
  const mode = useWatch({ control: form.control, name: "mode" });
  const state = useSaveSignature(userId);
  const submit = form.handleSubmit(async (values) => { if (await state.save(values)) { form.reset(emptySignature); toast.success("Signature saved and verified"); } });
  return <form className="max-w-2xl space-y-4" noValidate onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    <div className="space-y-2"><h2 className="font-medium">Saved signature</h2>
      {state.confirmed || storedPath ? <img src={state.confirmed ?? storedPath ?? ""} alt="Your saved signature" className="h-28 max-w-full rounded-lg border bg-white object-contain p-3" /> : <p className="text-sm text-muted-foreground">No signature has been saved.</p>}
    </div>
    <fieldset disabled={state.busy} className="space-y-4"><legend className="mb-3 font-medium">Replace your signature</legend>
      <Tabs value={mode} onValueChange={(value) => { if (value === "draw" || value === "type" || value === "upload") form.setValue("mode", value, { shouldDirty: true }); }}>
        <TabsList aria-label="Signature method"><TabsTrigger disabled={state.busy} value="draw">Draw</TabsTrigger><TabsTrigger disabled={state.busy} value="type">Type</TabsTrigger><TabsTrigger disabled={state.busy} value="upload">Upload</TabsTrigger></TabsList>
        <TabsContent value="draw"><FormWizard form={form} fields={drawing} /></TabsContent>
        <TabsContent value="type"><FormWizard form={form} fields={typing} /></TabsContent>
        <TabsContent value="upload"><FormWizard form={form} fields={uploading} /></TabsContent>
      </Tabs>
    </fieldset>
    {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
    <p className="text-xs text-muted-foreground">The saved image is read back and verified before your draft is cleared.</p>
    <Button type="submit" disabled={state.busy}>{state.busy ? <><Spinner />Saving and verifying…</> : "Save signature"}</Button>
  </form>;
}
