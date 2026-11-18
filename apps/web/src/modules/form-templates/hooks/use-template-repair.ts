import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { randomId } from "@/shared/ids/random-id";
import { useApplyTemplateRepairMutation, usePreviewTemplateRepairMutation } from "../api/template-repair-api";
import { templateRepairInputSchema, templateRepairAudit, templateRepairPermissions, templateRepairPreviewSchema, templateRepairReceiptSchema,
  type TemplateRepairContext, type TemplateRepairInput, type TemplateRepairPreview, type TemplateRepairReceipt } from "../lib/template-repair-schema";

export function useTemplateRepair(context: TemplateRepairContext, refresh: () => void) {
  const form = useForm<TemplateRepairInput>({ resolver: zodResolver(templateRepairInputSchema), defaultValues: { assignments: [], reason: "" } });
  const assignments = useWatch({ control: form.control, name: "assignments" });
  const fingerprint = JSON.stringify({ assignments, context });
  const [review, setReview] = useState<{ fingerprint: string; preview: TemplateRepairPreview } | null>(null);
  const [receipt, setReceipt] = useState<TemplateRepairReceipt | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, previewing] = usePreviewTemplateRepairMutation();
  const [apply, applying] = useApplyTemplateRepairMutation();
  const variantKeys = context.tests.filter(test => assignments.some(a => a.formAssigneeId === test.formAssigneeId))
    .map(test => test.kind === 0 ? "CanReassignProductTest" : test.kind === 1 ? "CanReassignRawMaterialTest" : "CanReassignPackagingMaterialTest");
  const applyAccess = usePermissionAction({ kind: "all", permissions: [templateRepairPermissions.apply, ...variantKeys] });
  const previewAccess = usePermissionAction({ kind: "all", permissions: [templateRepairPermissions.view, ...variantKeys] });
  const pending = useRef(false);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const current = review?.fingerprint === fingerprint ? review.preview : null;
  const submit = (mode: "preview" | "apply") => form.handleSubmit(async input => {
    if (pending.current || receipt) return;
    setProblem(null);
    const denied = mode === "preview" ? previewAccess.check() : applyAccess.check();
    if (denied) { setProblem(denied); setReview(null); return; }
    if (mode === "apply" && (!context.canApply || !current || current.blockers.length)) { setProblem("Review a current, successful preview before applying."); return; }
    const reason = input.reason.trim();
    if (mode === "apply" && (reason.length < 10 || reason.length > 1000)) {
      form.setError("reason", { message: "Explain the repair in 10–1000 characters." }); return;
    }
    pending.current = true;
    try {
      const candidate = { assignments: input.assignments };
      if (mode === "preview") {
        const result = await preview({ ...templateRepairAudit, formId: context.formId, appServicesFormsTemplateRepairCandidate: candidate });
        if ("error" in result) { setProblem(apiErrorMessage(result.error)); setReview(null); refresh(); return; }
        const parsed = templateRepairPreviewSchema.safeParse(result.data);
        if (!parsed.success) { setProblem("The preview could not be read. Preview again."); setReview(null); return; }
        setReview({ fingerprint, preview: parsed.data }); return;
      }
      if (!current) return;
      const recheck = applyAccess.check();
      if (recheck) { setProblem(recheck); setReview(null); return; }
      const key = `${current.previewToken}|${reason}|${JSON.stringify(candidate)}`;
      if (attempt.current?.key !== key) attempt.current = { key, id: randomId() };
      const result = await apply({ ...templateRepairAudit, formId: context.formId, appServicesFormsApplyTemplateRepairRequest: {
        candidate, previewToken: current.previewToken, reason, requestId: attempt.current.id,
      } });
      if ("error" in result) {
        setProblem(apiErrorMessage(result.error));
        if (result.error && "status" in result.error && (result.error.status === 403 || result.error.status === 409)) { setReview(null); refresh(); }
        return;
      }
      const parsed = templateRepairReceiptSchema.safeParse(result.data);
      if (!parsed.success) { setProblem("The repair receipt could not be read. Retry the same reviewed request."); return; }
      setReceipt(parsed.data);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The repair could not be confirmed. Retry the same reviewed request.");
    } finally { pending.current = false; }
  });
  return { form, assignments, current, receipt, problem, submit, busy: previewing.isLoading || applying.isLoading,
    restart: () => { setReceipt(null); setReview(null); form.reset({ assignments: [], reason: "" }); refresh(); },
    canApply: applyAccess.allowed && context.canApply };
}
