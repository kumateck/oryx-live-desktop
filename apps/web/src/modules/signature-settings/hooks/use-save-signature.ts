import { useEffect, useRef, useState } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { prepareSignature } from "../lib/signature-images";
import { verifySignature } from "../lib/verify-signature";
import { signatureProfileSchema, type SignatureValues } from "../schemas/signature-schema";

export const signatureAudit = { module: "Settings", subModule: "Signature" };
export function useSaveSignature(userId: string) {
  const [upload] = identityApi.usePostApiV1UserSignatureByIdMutation();
  const [read] = identityApi.useLazyGetApiV1UserAuthenticatedQuery();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const save = async (values: SignatureValues): Promise<boolean> => {
    if (controller.current) return false;
    const current = new AbortController(); controller.current = current;
    setBusy(true); setError("");
    try {
      const data = await prepareSignature(values, current.signal);
      const response = await upload({ ...signatureAudit, id: userId, sharedRequestsUploadFileRequest: { file: data } });
      if (current.signal.aborted) return false;
      if ("error" in response) throw new Error(apiErrorMessage(response.error));
      const profile = await read(signatureAudit, false);
      if (current.signal.aborted) return false;
      if ("error" in profile) throw new Error(apiErrorMessage(profile.error));
      const parsed = signatureProfileSchema.safeParse(profile.data);
      if (!parsed.success || parsed.data.id !== userId) throw new Error("The server did not return your signature profile safely.");
      await verifySignature(parsed.data.signature, data, current.signal);
      if (current.signal.aborted) return false;
      setConfirmed(data); return true;
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : "The signature could not be verified. Keep your draft and try again.");
      return false;
    } finally { controller.current = null; if (!current.signal.aborted) setBusy(false); }
  };
  return { busy, error, confirmed, save };
}
