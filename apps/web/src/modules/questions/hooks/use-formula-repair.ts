import { zodResolver } from "@hookform/resolvers/zod";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { useApplyFormulaRepairMutation, usePreviewFormulaRepairMutation } from "@/shared/formula/repairs/api";
import { formulaRepairPermissions } from "@/shared/formula/repairs/access";
import { randomId } from "@/shared/ids/random-id";
import { formulaRepairDefaults, manualRepairVariables, repairedFormulaDefinition } from "../lib/formula-repair";
import { formulaRepairValuesSchema, repairPreviewSchema, repairReasonSchema, repairReceiptSchema, repairTestKey,
  type FormulaRepairValues, type RepairContext, type RepairPreview, type RepairProblem, type RepairReceipt } from "../schemas/formula-repair-schema";
import { questionsAudit } from "../lib/questions";

const staleCodes = new Set(["FormulaRepair.StalePreview", "FormulaRepair.ConcurrentChange", "FormulaRepair.RequestReused"]);
/** 403 and 409 need a fresh preview; network and server failures keep the reviewed request for an identical retry. */
export function repairProblem(error: FetchBaseQueryError | SerializedError | undefined): RepairProblem {
  const message = apiErrorMessage(error);
  const status = error && "status" in error ? error.status : null;
  if (status === 403) return { kind: "denied", message };
  if (status === 409) return { kind: staleCodes.has(apiErrorCode(error) ?? "") ? "stale" : "invalid", message };
  if (typeof status === "number" && status < 500) return { kind: "invalid", message };
  return { kind: "unconfirmed", message: `${message} The repair may not have been saved. Retry the same reviewed request; it will not be applied twice.` };
}

export function useFormulaRepair(context: RepairContext, atr: string | null, field: string | null, refresh: () => void,
  onBack?: () => void, onApplied?: (definition: string) => void) {
  const initial = useMemo(() => formulaRepairDefaults(context.definition), [context.definition]);
  const form = useForm<FormulaRepairValues>({ resolver: zodResolver(formulaRepairValuesSchema), defaultValues: {
    ...initial, updateQuestion: !atr && context.canRepairQuestion, selectedTests: context.tests.filter(t => t.eligible && t.atrId === atr && t.formFieldId === field).map(repairTestKey), reason: "",
  } });
  const [expression, labels, updateQuestion, selectedTests] = useWatch({ control: form.control, name: ["expression", "labels", "updateQuestion", "selectedTests"] });
  // The reason is entered after reviewing, so it is not part of what the preview covers.
  const fingerprint = JSON.stringify({ expression, labels, updateQuestion, selectedTests });
  const [preview, setPreview] = useState<{ fingerprint: string; value: RepairPreview } | null>(null);
  const [problem, setProblem] = useState<RepairProblem | null>(null);
  const [receipt, setReceipt] = useState<RepairReceipt | null>(null);
  const [runPreview, previewing] = usePreviewFormulaRepairMutation();
  const [apply, applying] = useApplyFormulaRepairMutation();
  const question = usePermissionAction(formulaRepairPermissions.question);
  const tests = usePermissionAction(formulaRepairPermissions.test);
  const pending = useRef(false);
  const attempt = useRef<{ key: string; id: string } | null>(null);
  const navigate = useNavigate();
  const current = preview?.fingerprint === fingerprint ? preview.value : null;
  const fail = (next: RepairProblem) => {
    setProblem(next);
    if (next.kind === "denied" || next.kind === "stale") { setPreview(null); attempt.current = null; }
    if (next.kind === "stale") refresh();
  };
  const submit = (mode: "preview" | "apply") => form.handleSubmit(async (input) => {
    if (pending.current) return;
    setProblem(null);
    const selected = context.tests.filter(t => input.selectedTests.includes(repairTestKey(t)));
    if (selected.length !== input.selectedTests.length || selected.some(t => !t.eligible)) { fail({ kind: "stale", message: "The test list changed. It has been reloaded; review your selection." }); return; }
    if (!input.updateQuestion && selected.length === 0) { setProblem({ kind: "invalid", message: "Choose the shared question or at least one open test." }); return; }
    const check = () => input.updateQuestion && question.check() || selected.length > 0 && tests.check() || null;
    const denied = check(); if (denied) { fail({ kind: "denied", message: denied }); return; }
    const candidate = { definition: repairedFormulaDefinition(context.definition, input.expression, input.labels), updateQuestion: input.updateQuestion,
      targets: selected.map(t => ({ atrId: t.atrId, formFieldId: t.formFieldId })) };
    if (mode === "apply") {
      if (!current || current.blockers.length) { setProblem({ kind: "stale", message: "Review a current, successful preview before applying." }); return; }
      const reason = repairReasonSchema.safeParse(input.reason);
      if (!reason.success) { form.setError("reason", { message: reason.error.issues[0]?.message ?? "Enter a reason." }); return; }
    }
    pending.current = true;
    try {
      if (mode === "preview") {
        const result = await runPreview({ ...questionsAudit, questionId: context.questionId, appServicesFormulasFormulaRepairCandidate: candidate });
        if ("error" in result) { fail(repairProblem(result.error)); return; }
        const parsed = repairPreviewSchema.safeParse(result.data);
        if (!parsed.success) { setProblem({ kind: "invalid", message: "The server returned an unreadable preview. Preview again." }); return; }
        setPreview({ fingerprint, value: parsed.data });
        return;
      }
      if (!current) return;
      const recheck = check(); if (recheck) { fail({ kind: "denied", message: recheck }); return; }
      const reason = input.reason.trim();
      // One request ID per reviewed preview and reason: an identical retry after a lost response returns the committed repair.
      const key = `${current.previewToken}|${reason}`;
      if (attempt.current?.key !== key) attempt.current = { key, id: randomId() };
      const result = await apply({ ...questionsAudit, questionId: context.questionId, appServicesFormulasApplyFormulaRepairRequest: {
        candidate, reason, previewToken: current.previewToken, requestId: attempt.current.id } });
      if ("error" in result) { fail(repairProblem(result.error)); return; }
      const parsed = repairReceiptSchema.safeParse(result.data);
      if (!parsed.success) { setProblem({ kind: "unconfirmed", message: "The repair receipt could not be read. Retry this same reviewed request." }); return; }
      setReceipt(parsed.data); form.reset(input); toast.success(parsed.data.alreadyApplied ? "Formula repair was already saved" : "Formula repair saved");
      if (candidate.targets.some(target => target.atrId === atr && target.formFieldId === field))
        onApplied?.(candidate.definition);
    } catch (error) {
      setProblem({ kind: "unconfirmed", message: error instanceof Error ? error.message : "The repair could not be confirmed. Retry the same reviewed request." });
    } finally { pending.current = false; }
  });
  return { form, manualKeys: manualRepairVariables(context.definition, expression), preview: current, problem, receipt, submit,
    busy: previewing.isLoading || applying.isLoading, applying: applying.isLoading,
    back: onBack ?? (() => void navigate(atr ? `/atr/${encodeURIComponent(atr)}/test` : "/settings/questions")),
    canApply: Boolean(current && !current.blockers.length && !receipt) };
}
