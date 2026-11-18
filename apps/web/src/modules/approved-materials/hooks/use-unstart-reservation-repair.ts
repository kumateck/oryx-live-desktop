import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { randomId } from "@/shared/ids/random-id";
import { usePreviewRawUnstartReservationsQuery, usePreviewPackagingUnstartReservationsQuery,
  useReleaseRawUnstartReservationsMutation, useReleasePackagingUnstartReservationsMutation } from "../api/unstart-reservations-api";
import { reservationRepairPermissions, unstartReservationPreviewSchema, unstartReservationReasonSchema, type ReservationRepairReason } from "../schemas/unstart-reservations";
import { audit } from "../lib/approved-material-access";

export function useUnstartReservationRepair(materialId: string, kind: 0 | 1, onClose: () => void) {
  const permission = usePermissionAction(reservationRepairPermissions[kind]);
  const raw = usePreviewRawUnstartReservationsQuery({ ...audit, materialId }, { skip: kind !== 0 || !permission.allowed, refetchOnMountOrArgChange: true });
  const packaging = usePreviewPackagingUnstartReservationsQuery({ ...audit, materialId }, { skip: kind !== 1 || !permission.allowed, refetchOnMountOrArgChange: true });
  const query = kind === 0 ? raw : packaging;
  const [repairRaw, rawMutation] = useReleaseRawUnstartReservationsMutation();
  const [repairPackaging, packagingMutation] = useReleasePackagingUnstartReservationsMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const pending = useRef(false);
  const attempt = useRef<{ payload: string; id: string } | null>(null);
  const form = useForm<ReservationRepairReason>({ resolver: zodResolver(unstartReservationReasonSchema), defaultValues: { reason: "" } });
  const parsed = unstartReservationPreviewSchema.safeParse(query.currentData);
  const preview = permission.allowed && parsed.success ? parsed.data : null;
  const error = query.error ? apiErrorMessage(query.error) : query.isSuccess && !preview ? "The server returned an unreadable preview. Reload before continuing." : null;
  const busy = rawMutation.isLoading || packagingMutation.isLoading;
  const reload = async () => {
    if (pending.current || !permission.allowed) return;
    setSelected([]); setMessage(""); setNeedsReview(true);
    const result = await query.refetch();
    if (!result.error) setNeedsReview(false);
  };
  const submit = form.handleSubmit(async ({ reason }) => {
    if (pending.current || !preview || error || needsReview || query.isFetching || !selected.length) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const ids = [...selected].sort();
    if (ids.some(id => !preview.reservations.some(row => row.reservationId === id && row.blockers.length === 0))) return;
    const payload = JSON.stringify({ token: preview.previewToken, ids, reason });
    if (attempt.current?.payload !== payload) attempt.current = { payload, id: randomId() };
    pending.current = true; setMessage("");
    try {
      const args = { ...audit, materialId, domainEntitiesProductsProductionReleaseUnstartReservationsRequest: {
        requestId: attempt.current.id, previewToken: preview.previewToken, reservationIds: ids, reason,
      } };
      const result = await (kind === 0 ? repairRaw(args) : repairPackaging(args));
      if ("error" in result) { setMessage(apiErrorMessage(result.error)); setNeedsReview(true); return; }
      if (!result.data.repairId || result.data.releasedCount !== ids.length) { setMessage("The repair result could not be confirmed. Reload before retrying."); setNeedsReview(true); return; }
      toast.success(`${result.data.releasedCount} unused reservation(s) released`, { description: `Repair reference: ${result.data.repairId}` });
      onClose();
    } catch { setMessage("The repair response could not be confirmed. Reload before retrying."); setNeedsReview(true); }
    finally { pending.current = false; }
  });
  return { permission, form, preview, error, message, needsReview, busy, loading: query.isLoading, fetching: query.isFetching,
    selected, toggle: (id: string, checked: boolean) => setSelected(current => checked ? [...new Set([...current, id])] : current.filter(value => value !== id)),
    reload, submit, close: () => { if (!pending.current) onClose(); },
    blocked: busy || query.isFetching || !preview || !!error || needsReview || !permission.allowed || !selected.length };
}
