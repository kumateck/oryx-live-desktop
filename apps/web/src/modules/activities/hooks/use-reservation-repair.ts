import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { randomId } from "@/shared/ids/random-id";
import { useApplyReservationRepairMutation, usePreviewReservationRepairQuery } from "../api/reservation-repair-api";
import { reservationRepairPermission, reservationRepairPreviewSchema, reservationRepairReasonSchema,
  reservationRepairReceiptSchema, type ReservationRepairReason } from "../schemas/reservation-repair";

const audit = { module: "Production", subModule: "Reservation repair" } as const;

export function useReservationRepair(batchId: string, onClose: () => void) {
  const permission = usePermissionAction(reservationRepairPermission);
  const query = usePreviewReservationRepairQuery({ ...audit, batchId }, { skip: !permission.allowed,
    refetchOnMountOrArgChange: true, refetchOnFocus: false, refetchOnReconnect: false });
  const [apply, mutation] = useApplyReservationRepairMutation();
  const [message, setMessage] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const pending = useRef(false);
  const attempt = useRef<{ token: string; reason: string; id: string } | null>(null);
  const form = useForm<ReservationRepairReason>({ resolver: zodResolver(reservationRepairReasonSchema), defaultValues: { reason: "" } });
  const parsed = reservationRepairPreviewSchema.safeParse(query.currentData);
  const preview = permission.allowed && parsed.success && parsed.data.batchId === batchId ? parsed.data : null;
  const error = query.error ? apiErrorMessage(query.error) : query.isSuccess && !preview
    ? "The server returned an unreadable reservation preview. Reload it before continuing." : null;
  const reload = async () => {
    if (pending.current || !permission.allowed) return;
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
      if (!attempt.current || attempt.current.token !== preview.previewToken || attempt.current.reason !== reason)
        attempt.current = { id: randomId(), token: preview.previewToken, reason };
      const result = await apply({ ...audit, batchId, domainEntitiesProductsProductionReservationRepairRequest: {
        requestId: attempt.current.id, previewToken: preview.previewToken, reason,
      } });
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); setNeedsReview(true); return; }
      const receipt = reservationRepairReceiptSchema.safeParse(result.data);
      if (!receipt.success || receipt.data.repairId !== attempt.current.id) {
        setMessage("The repair receipt could not be confirmed. Reload and check repair history before trying again.");
        setNeedsReview(true);
        return;
      }
      toast.success(receipt.data.alreadyApplied ? "Reservations were already repaired" : "Stock reservations repaired", {
        description: `Repair reference: ${receipt.data.repairId}`,
      });
      onClose();
    } catch {
      setMessage("The repair response could not be confirmed. Reload and check repair history before trying again.");
      setNeedsReview(true);
    } finally { pending.current = false; }
  });
  return { permission, form, preview, error, message, needsReview, reload, submit,
    busy: mutation.isLoading, loading: query.isLoading, fetching: query.isFetching,
    close: () => { if (!pending.current) onClose(); },
    blocked: mutation.isLoading || query.isFetching || !preview?.canApply || Boolean(error) || needsReview || !permission.allowed,
  };
}
