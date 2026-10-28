import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { stpDocumentExtraApi } from "./stp-document-api";

export interface VersionFile { id: string; fileName?: string | null | undefined; versionNumber?: number | null | undefined }
export const versionFileName = (version: VersionFile) => version.fileName ?? `stp-v${String(version.versionNumber)}.docx`;

/** Uses the existing authenticated, audited file endpoint for both preview and explicit download. */
export function useVersionFile(documentId: string) {
  const [download] = stpDocumentExtraApi.useDownloadStpDocumentVersionMutation();
  const [busy, setBusy] = useState<string | null>(null);
  const read = async (version: VersionFile, signal: AbortSignal): Promise<Blob> => {
    signal.throwIfAborted();
    const request = download({ documentId, versionId: version.id });
    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      const result = await request;
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
      try {
        signal.throwIfAborted();
        // The API adapter returns an owned local object URL, never a URL from record content.
        const response = await fetch(result.data, { signal, credentials: "omit" });
        if (!response.ok) throw new Error("The version file could not be read. Try again.");
        return await response.blob();
      } finally { URL.revokeObjectURL(result.data); }
    } finally { signal.removeEventListener("abort", abort); }
  };
  const save = async (version: VersionFile) => {
    setBusy(version.id);
    const result = await download({ documentId, versionId: version.id });
    setBusy(null);
    if ("error" in result) { toast.error(apiErrorMessage(result.error)); return; }
    const link = window.document.createElement("a");
    link.href = result.data;
    link.download = versionFileName(version);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(result.data), 1000);
  };
  return { read, save, busy };
}
