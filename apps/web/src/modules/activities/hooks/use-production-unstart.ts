import { randomId } from "@/shared/ids/random-id";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { scheduleDetailPath } from "@/modules/schedules/lib/schedule-access";
import { useApplyProductionUnstartMutation, usePreviewProductionUnstartQuery } from "../api/production-unstart-api";
import { unstartPermission, unstartPreviewSchema, unstartReasonSchema, type UnstartReason } from "../schemas/production-unstart";

const audit = { module: "Production", subModule: "Unstart production" } as const;

export function useProductionUnstart(activityId: string, onClose: () => void) {
  const permission = usePermissionAction(unstartPermission);
  const query = usePreviewProductionUnstartQuery({ ...audit, activityId }, { skip: !permission.allowed,
    refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: false });
  const [apply, mutation] = useApplyProductionUnstartMutation();
  const [message, setMessage] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const pending = useRef(false);
  const attempt = useRef<{ id: string; token: string; reason: string } | null>(null);
  const navigate = useNavigate();
  const form = useForm<UnstartReason>({ resolver: zodResolver(unstartReasonSchema), defaultValues: { reason: "" } });
  const parsed = unstartPreviewSchema.safeParse(query.currentData);
  const preview = permission.allowed && parsed.success && parsed.data.activityId === activityId ? parsed.data : null;
  const error = query.error ? apiErrorMessage(query.error) : query.isSuccess && !preview ? "The server returned an unreadable unstart preview. Reload it before continuing." : null;
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
    if (!preview?.canApply || error || query.isFetching || needsReview) return;
    pending.current = true; setMessage("");
    try {
      if (!attempt.current || attempt.current.token !== preview.previewToken || attempt.current.reason !== reason)
        attempt.current = { id: randomId(), token: preview.previewToken, reason };
      const result = await apply({ ...audit, activityId, domainEntitiesProductsProductionProductionUnstartRequest: {
        requestId: attempt.current.id, previewToken: preview.previewToken, reason,
      } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); setNeedsReview(true); return; }
      const receipt = result.data;
      if (!receipt.scheduleId || !receipt.batchId || !receipt.repairId) { setMessage("The result could not be confirmed. Reload the preview before retrying."); setNeedsReview(true); return; }
      toast.success(receipt.alreadyApplied ? "This production run was already unstarted" : "Production unstarted", { description: `Repair reference: ${receipt.repairId}` });
      onClose();
      void navigate(`${scheduleDetailPath(receipt.scheduleId)}?batch=${receipt.batchId}`, { replace: true });
    } catch {
      setMessage("The repair response could not be confirmed. Reload before retrying."); setNeedsReview(true);
    } finally { pending.current = false; }
  });
  return { form, preview, permission, message, error, needsReview, reload, submit, loading: query.isLoading,
    busy: mutation.isLoading, fetching: query.isFetching,
    blocked: mutation.isLoading || query.isFetching || !preview?.canApply || Boolean(error) || needsReview || !permission.allowed,
    close: () => { if (!pending.current) onClose(); },
  };
}
