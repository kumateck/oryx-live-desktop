import { useState } from "react";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RevisionStatus, type RevisionDetail } from "./stp-content";
import { stpRevisionKeys } from "./stp-keys";
import { useDownloadStpRevisionFileMutation } from "./stp-revision-api";

/** Saves the revision's Word file: the approved file as kept at approval, or a draft file marked as such. */
export function useRevisionFile(revision: Pick<RevisionDetail, "id" | "kind" | "stpNumber" | "revisionNumber" | "status"> | null) {
  const [download] = useDownloadStpRevisionFileMutation();
  const permission = usePermissionAction(stpRevisionKeys(revision?.kind ?? 0).export);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!revision) return;
    const denied = permission.check();
    if (denied) { toast.error(denied); return; }
    setBusy(true);
    const result = await download({ id: revision.id });
    setBusy(false);
    if ("error" in result) { toast.error(apiErrorMessage(result.error)); return; }
    const approved = revision.status === RevisionStatus.Approved || revision.status === RevisionStatus.Superseded;
    const link = window.document.createElement("a");
    link.href = result.data;
    link.download = `${revision.stpNumber.replaceAll("/", "-")} Rev ${String(revision.revisionNumber).padStart(2, "0")}${approved ? "" : " DRAFT"}.docx`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(result.data), 1000);
  };
  return { save, busy };
}
