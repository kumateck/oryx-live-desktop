import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { utcBoundary } from "@/shared/format/date-boundary";
import { useComputePerformanceMutation, usePersistPerformanceMutation } from "./relationship-api";
import { performanceSchema, type PerformanceValues } from "./schemas";
import type { Performance, PerformanceRequest } from "./types";

const startOfYear = () => new Date(new Date().getFullYear(), 0, 1);

export function PerformanceDialog({ supplierId, open, onOpenChange }: {
  supplierId: string; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [compute, computing] = useComputePerformanceMutation();
  const [persist, persisting] = usePersistPerformanceMutation();
  const [preview, setPreview] = useState<Performance | null>(null);
  const [previewRequest, setPreviewRequest] = useState<PerformanceRequest | null>(null);
  const [previewKey, setPreviewKey] = useState("");
  const [error, setError] = useState("");
  const permission = usePermissionAction("CanViewSupplierPerformance");
  const form = useForm<PerformanceValues>({ resolver: zodResolver(performanceSchema), defaultValues: {
    periodStart: startOfYear(), periodEnd: new Date(), deliveryWeight: 0.6,
  } });
  const current = useWatch({ control: form.control, name: ["periodStart", "periodEnd", "deliveryWeight"] });
  const currentKey = current.map((value) => value instanceof Date ? value.getTime() : value).join(":");
  const fields = [
    { type: InputTypes.DATE, name: "periodStart", label: "Period start", required: true },
    { type: InputTypes.DATE, name: "periodEnd", label: "Period end", required: true },
    { type: InputTypes.NUMBER, name: "deliveryWeight", label: "On-time delivery weight", min: 0, max: 1, step: 0.1, required: true },
  ] as const satisfies readonly WizardField<PerformanceValues>[];
  const runPreview = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      const body = {
        periodStart: utcBoundary(values.periodStart), periodEnd: utcBoundary(values.periodEnd, true),
        onTimeDeliveryWeight: values.deliveryWeight, qualityWeight: Number((1 - values.deliveryWeight).toFixed(3)),
      };
      const result = await compute({ supplierId, body });
      if ("error" in result) { setPreview(null); setPreviewRequest(null); setPreviewKey(""); setError(apiErrorMessage(result.error)); return; }
      setPreview(result.data); setPreviewRequest(body); setPreviewKey(currentKey);
    })();
  };
  const save = async () => {
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    if (!previewRequest || previewKey !== currentKey) return;
    setError("");
    const result = await persist({ supplierId, body: previewRequest });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success("Performance scorecard preserved"); onOpenChange(false);
  };
  const busy = computing.isLoading || persisting.isLoading;
  const previewIsCurrent = Boolean(previewRequest) && previewKey === currentKey;
  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>Evaluate supplier performance</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => void runPreview(event)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        <p className="mt-2 text-xs text-muted-foreground">Quality weight is the remainder to 1. Preview the result before preserving it.</p>
        {preview ? <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-3 text-center">
          <Metric label="Score" value={preview.score} /><Metric label="On-time delivery" value={preview.onTimeDeliveryRate} />
          <Metric label="Reject rate" value={preview.qualityRejectRate} />
          <p className="col-span-3 text-xs text-muted-foreground">{preview.evaluatedDeliveries} deliveries · {preview.evaluatedBatches} batches evaluated</p>
          {preview.dataQualityWarnings.map((warning) => <p key={warning} className="col-span-3 text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
        </div> : null}
        {preview && !previewIsCurrent ? <p className="mt-2 text-xs text-muted-foreground">Inputs changed. Compute a new preview before preserving.</p> : null}
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" variant="outline" disabled={busy || !permission.allowed}>{computing.isLoading ? <><Spinner />Computing…</> : "Compute preview"}</Button>
        <Button type="button" disabled={busy || !permission.allowed || !previewIsCurrent} onClick={() => void save()}>{persisting.isLoading ? <><Spinner />Preserving…</> : "Preserve scorecard"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value.toFixed(1)}{label === "Score" ? "" : "%"}</p></div>;
}
