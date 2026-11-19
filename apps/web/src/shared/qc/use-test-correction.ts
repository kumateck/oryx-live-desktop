import { skipToken } from "@reduxjs/toolkit/query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formsApi } from "@/shared/api/generated/forms";
import { addTags } from "@/shared/api/add-tags";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { testCorrectionAccess, type TestCorrectionKind } from "./test-correction-access";

const schema = z.object({ reason: z.string().trim().min(1, "Explain what the analyst needs to correct.").max(2000) });
const api = formsApi.enhanceEndpoints({ addTagTypes: ["Atrs", "AtrWork", "QcGrns", "QcBatch", "QcBatchResults"], endpoints: {
  returnProductTestForCorrection: d => { d.invalidatesTags = addTags(d.invalidatesTags, (_r, e) => e ? [] : ["Atrs", "AtrWork"]); },
  returnRawMaterialTestForCorrection: d => { d.invalidatesTags = addTags(d.invalidatesTags, (_r, e) => e ? [] : ["QcGrns", "QcBatch", "QcBatchResults"]); },
  returnPackagingMaterialTestForCorrection: d => { d.invalidatesTags = addTags(d.invalidatesTags, (_r, e) => e ? [] : ["QcGrns", "QcBatch", "QcBatchResults"]); },
} });
export function useTestCorrection(responseId: string, kind: TestCorrectionKind, onReturned: () => void) {
  const access = testCorrectionAccess[kind];
  const permission = usePermissionAction(access.return);
  const historyAccess = usePermissionAction(access.history);
  const args = { responseId, module: "Quality Control", subModule: "Test corrections" };
  const product = api.useGetProductTestCorrectionHistoryQuery(historyAccess.allowed && kind === "product" ? args : skipToken);
  const raw = api.useGetRawMaterialTestCorrectionHistoryQuery(historyAccess.allowed && kind === "raw" ? args : skipToken);
  const packaging = api.useGetPackagingMaterialTestCorrectionHistoryQuery(historyAccess.allowed && kind === "packaging" ? args : skipToken);
  const query = kind === "product" ? product : kind === "raw" ? raw : packaging;
  const [returnProduct] = api.useReturnProductTestForCorrectionMutation();
  const [returnRaw] = api.useReturnRawMaterialTestForCorrectionMutation();
  const [returnPackaging] = api.useReturnPackagingMaterialTestForCorrectionMutation();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const pending = useRef(false);
  const submit = form.handleSubmit(async input => {
    if (pending.current) return;
    const denied = permission.check();
    if (denied) { setProblem(denied); return; }
    pending.current = true; setBusy(true); setProblem(null);
    try {
      const request = { ...args, appServicesFormsReturnTestForCorrectionRequest: input };
      const result = await (kind === "product" ? returnProduct(request) : kind === "raw" ? returnRaw(request) : returnPackaging(request));
      if ("error" in result) { setProblem(apiErrorMessage(result.error)); return; }
      setOpen(false); form.reset(); onReturned();
    } catch (error) { setProblem(error instanceof Error ? error.message : "The return could not be confirmed. Reload the worksheet before retrying."); }
    finally { pending.current = false; setBusy(false); }
  });
  return { access, allowed: permission.allowed, canViewHistory: historyAccess.allowed, history: query.currentData, loading: query.isFetching,
    historyError: query.error ? apiErrorMessage(query.error) : null, retry: query.refetch, open, setOpen, busy, problem, form, submit };
}
