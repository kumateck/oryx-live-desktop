import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { randomId } from "@/shared/ids/random-id";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useApplyIssuedMaterialRepairMutation, usePreviewIssuedMaterialRepairQuery } from "../api/issued-material-repair-api";
import { issuedRepairPermissions, repairPreviewSchema, repairReasonSchema, type RepairKind, type RepairReason } from "../schemas/issued-material-repair";

const audit = { module: "Production", subModule: "Post-issue repair" } as const;

export function useIssuedMaterialRepair(batchId: string, kind: RepairKind, onClose: () => void) {
  const permission = usePermissionAction(issuedRepairPermissions[kind]);
  // Keep the reviewed snapshot stable until an explicit reload. The server rechecks it under lock.
  const query = usePreviewIssuedMaterialRepairQuery({ ...audit, batchId, kind }, { skip: !permission.allowed, refetchOnMountOrArgChange: true,
    refetchOnFocus: false, refetchOnReconnect: false });
  const [apply, mutation] = useApplyIssuedMaterialRepairMutation();
  const [message, setMessage] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const pending = useRef(false);
  const attempt = useRef<{ token: string; reason: string; id: string } | null>(null);
  const form = useForm<RepairReason>({ resolver: zodResolver(repairReasonSchema), defaultValues: { reason: "" } });
  const parsed = repairPreviewSchema.safeParse(query.currentData);
  const preview = permission.allowed && parsed.success && parsed.data.batchId === batchId && parsed.data.kind === kind ? parsed.data : null;
  const error = query.error ? apiErrorMessage(query.error) : query.isSuccess && !preview ? "The server returned an unreadable repair preview. Reload it before continuing." : null;
  const reload = async () => {
    if (pending.current) return;
    setMessage("");
    const result = await query.refetch();
    if (!result.error) setNeedsReview(false);
  };
  const submit = form.handleSubmit(async ({ reason }) => {
    if (pending.current) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!preview?.canApply || query.isFetching || needsReview || error) return;
    pending.current = true;
    setMessage("");
    try {
      // Reuse the ID after an uncertain response; the server can return the original receipt.
      // The shared helper also supports the customer's plain HTTP intranet origin.
      if (!attempt.current || attempt.current.token !== preview.previewToken || attempt.current.reason !== reason)
        attempt.current = { id: randomId(), token: preview.previewToken, reason };
      const result = await apply({ ...audit, batchId, kind, domainEntitiesProductsProductionApplyIssuedMaterialRepairRequest: {
        requestId: attempt.current.id, previewToken: preview.previewToken, reason,
      } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); setNeedsReview(true); return; }
      toast.success(result.data.alreadyApplied ? "Issued stock is already reconciled" : "Issued stock repaired", {
        description: result.data.repairId ? `Repair reference: ${result.data.repairId}` : "No further stock adjustment was needed.",
      });
      onClose();
    } catch {
      setMessage("The repair response could not be confirmed. Reload the saved stock before retrying.");
      setNeedsReview(true);
    } finally { pending.current = false; }
  });
  return { permission, form, preview, error, message, needsReview, reload, submit,
    busy: mutation.isLoading, loading: query.isLoading, fetching: query.isFetching,
    close: () => { if (!pending.current) onClose(); },
    blocked: mutation.isLoading || query.isFetching || !preview?.canApply || Boolean(error) || needsReview || !permission.allowed,
  };
}
