import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { randomId } from "@/shared/ids/random-id";
import { useDesktopTabSafety } from "@/shared/workspace-tabs/context";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { scheduleRepairApi } from "../api/schedule-repair-api";
import { scheduleRepairFormSchema, scheduleRepairPreviewSchema, scheduleRepairRequirement,
  type ScheduleRepairKind, type ScheduleRepairPreview, type ScheduleRepairValues } from "../schemas/schedule-repair";

const audit = { module: "Production", subModule: "Schedule repair" } as const;
interface Attempt { id: string; hash: string; reason: string; productId: string }
interface Receipt { repairId: string; repaired: number; unchanged: number; skipped: number; requiringApproval: number }

export function useScheduleRepair(scheduleId: string, kind: ScheduleRepairKind, initialProduct: SelectOption | null) {
  const permission = usePermissionAction(scheduleRepairRequirement(kind));
  const form = useForm<ScheduleRepairValues>({ resolver: zodResolver(scheduleRepairFormSchema), defaultValues: { product: initialProduct, reason: "" } });
  const [read] = scheduleRepairApi.useLazyPreviewScheduleProductRepairQuery();
  const [apply] = scheduleRepairApi.useApplyScheduleProductRepairMutation();
  const [snapshot, setSnapshot] = useState<ScheduleRepairPreview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const pending = useRef(false);
  const attempt = useRef<Attempt | null>(null);
  const selected = form.watch("product")?.value;
  const preview = snapshot?.productId === selected ? snapshot : null;
  useDesktopTabSafety(form.formState.isDirty && !receipt, busy);

  const reload = async () => {
    if (pending.current || !(await form.trigger("product"))) return;
    const product = form.getValues("product");
    if (!product) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    pending.current = true; setBusy(true); setMessage("");
    try {
      const result = await read({ ...audit, scheduleId, productId: product.value, kind }, false);
      if (result.error) { setMessage(apiErrorMessage(result.error)); setNeedsReview(true); return; }
      const parsed = scheduleRepairPreviewSchema.safeParse(result.data);
      if (!parsed.success || parsed.data.scheduleId !== scheduleId || parsed.data.productId !== product.value || parsed.data.kind !== kind) {
        setSnapshot(null); setMessage("The server returned an unreadable preview. Reload before continuing."); return;
      }
      setSnapshot(parsed.data); setNeedsReview(false); setUncertain(false); setReceipt(null);
    } finally { pending.current = false; setBusy(false); }
  };

  const send = async (request: Attempt) => {
    if (pending.current) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    pending.current = true; setBusy(true); setMessage("");
    try {
      const result = await apply({ ...audit, scheduleId, productId: request.productId, kind,
        domainEntitiesProductsProductionApplyScheduleRepair: { requestId: request.id, previewHash: request.hash, reason: request.reason } });
      if (result.error) {
        setMessage(apiErrorMessage(result.error)); setNeedsReview(true);
        setUncertain(!("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500);
        return;
      }
      if (!result.data.repairId) { setMessage("The repair receipt could not be confirmed. Check the same request before continuing."); setNeedsReview(true); setUncertain(true); return; }
      setReceipt({ repairId: result.data.repairId, repaired: result.data.repaired ?? 0, unchanged: result.data.unchanged ?? 0,
        skipped: result.data.skipped ?? 0, requiringApproval: result.data.requiringApproval ?? 0 });
      setUncertain(false); setNeedsReview(false);
    } catch {
      setMessage("The result could not be confirmed. Check the same repair request before continuing."); setNeedsReview(true); setUncertain(true);
    } finally { pending.current = false; setBusy(false); }
  };

  const submit = form.handleSubmit(async ({ reason, product }) => {
    if (!product || !preview?.canApply || needsReview || receipt || preview.productId !== product.value) return;
    if (!attempt.current || attempt.current.hash !== preview.previewHash || attempt.current.reason !== reason || attempt.current.productId !== product.value)
      attempt.current = { id: randomId(), hash: preview.previewHash, reason, productId: product.value };
    await send(attempt.current);
  });
  return { form, permission, preview, reload, submit, message, busy, needsReview, uncertain, receipt,
    retry: async () => { if (attempt.current && uncertain) await send(attempt.current); },
    canClose: () => !pending.current,
    blocked: busy || !permission.allowed || !preview?.canApply || needsReview || Boolean(receipt),
  };
}
