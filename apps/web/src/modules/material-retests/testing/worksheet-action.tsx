import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useAnalystOptions } from "@/shared/qc/use-analyst-options";
import { worksheetSchema, worksheetPermission, type Worksheet, type WorksheetValues } from "./worksheet-model";
import { retestAudit as audit } from "../schemas/retest";
export type WorksheetAction = "start" | "save" | "submit" | "approve" | "reject" | "assign" | "reassign";
const chemicalAnalysts = ["CanStartChemicalWorksheet"];
const microbialAnalysts = ["CanStartMicrobialWorksheet"];
const schema = z.object({ password: z.string(), comments: z.string().trim().max(1000), analyst: z.object({ value: z.uuid(), label: z.string() }).nullable() });
type Values = z.infer<typeof schema>;
export function WorksheetActionDialog({ record, action, values, onClose, onDone }: { record: Worksheet; action: WorksheetAction; values: WorksheetValues; onClose: () => void; onDone: () => void }) {
  const reviewing = action === "approve" || action === "reject";
  const assigning = action === "assign" || action === "reassign";
  const require = action === "assign" ? "CanAssignWorksheet" : action === "reassign" ? "CanReassignWorksheet" : worksheetPermission(record.analysisType, reviewing ? "review" : action === "save" ? "enter" : action);
  const command = useVerifiedMutation<Worksheet>(require, record);
  const user = useCurrentUser();
  const [read] = qcApi.useLazyGetApiV1QcWorksheetsInstancesByIdQuery();
  const [start] = qcApi.usePostApiV1QcWorksheetsInstancesByIdStartMutation();
  const [save] = qcApi.usePutApiV1QcWorksheetsInstancesByIdValuesMutation();
  const [submit] = qcApi.usePostApiV1QcWorksheetsInstancesByIdSubmitMutation();
  const [review] = qcApi.usePostApiV1QcWorksheetsInstancesByIdReviewMutation();
  const [assign] = qcApi.usePostApiV1QcWorksheetsInstancesByIdAssignMutation();
  const [reassign] = qcApi.usePostApiV1QcWorksheetsInstancesByIdReassignMutation();
  const [pending] = qcApi.useLazyGetApiV1QcWorksheetsApprovalsMyPendingQuery();
  const analysts = useAnalystOptions(record.analysisType === 0 ? chemicalAnalysts : microbialAnalysts);
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", comments: "", analyst: null } });
  const fields: WizardField<Values>[] = reviewing ? [{ type: InputTypes.PASSWORD, name: "password", label: "Your password", required: true }, { type: InputTypes.TEXTAREA, name: "comments", label: "Decision reason", required: true }]
    : assigning ? [{ type: InputTypes.SELECT, name: "analyst", label: "Analyst", mode: "single", source: "async", loadOptions: analysts, required: true }, ...(action === "reassign" ? [{ type: InputTypes.TEXTAREA, name: "comments", label: "Reassignment reason", required: true } as const] : [])] : [];
  const execute = async (input: Values) => {
    if (reviewing && (!input.password || input.comments.length < 3)) { setMessage("Enter your own password and a decision reason."); return; }
    if (assigning && !input.analyst) { form.setError("analyst", { message: "Choose an eligible analyst" }); return; }
    if (action === "reassign" && input.comments.length < 3) { form.setError("comments", { message: "Record why this worksheet is reassigned" }); return; }
    const failure = await command.run(record, async () => {
      const fresh = worksheetSchema.parse(await read({ ...audit, id: record.id }, false).unwrap());
      if (reviewing) { const queue = await pending(audit, false).unwrap(); if (!queue.some((item) => item.entityType === "WorksheetInstance" && item.entityId === record.id)) throw new Error("This worksheet decision is no longer assigned to you."); }
      return fresh;
    }, async (fresh) => {
      if (!reviewing && !assigning && fresh.assignedToId !== user?.id) throw new Error("This worksheet is no longer assigned to you.");
      if (reviewing && fresh.status !== 2 || action === "start" && fresh.status !== 0 || (action === "save" || action === "submit") && fresh.status !== 1) throw new Error("This worksheet changed stage.");
      const args = { ...audit, id: record.id };
      const result = action === "start" ? await start(args) : action === "save" ? await save({ ...args, domainEntitiesQcWorksheetsSaveWorksheetValuesRequest: { fieldValues: values.cells } })
        : action === "submit" ? await submit(args) : action === "assign" && input.analyst ? await assign({ ...args, domainEntitiesQcWorksheetsAssignWorksheetInstanceRequest: { assignedToId: input.analyst.value } })
        : action === "reassign" && input.analyst ? await reassign({ ...args, domainEntitiesQcWorksheetsReassignWorksheetInstanceRequest: { assignedToId: input.analyst.value, reason: input.comments } })
        : await review({ ...args, domainEntitiesQcWorksheetsReviewWorksheetInstanceRequest: { approve: action === "approve", password: input.password, comments: input.comments } });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
    form.setValue("password", "");
    if (failure) setMessage(failure); else onDone();
  };
  const labels = { start: "Start worksheet", save: "Save draft values", submit: "Submit worksheet", approve: "Sign approval", reject: "Sign return for correction", assign: "Assign analyst", reassign: "Reassign analyst" };
  return <SettingsFormDialog title={labels[action]} description="Current worksheet state, assignment and your access are verified. Server calibration, reagent expiry, formula and release gates remain authoritative."
    form={form} fields={fields} saving={command.busy} submitDisabled={command.attempted || !command.allowed} message={message} submitLabel={labels[action]} onClose={onClose} onSubmit={execute} />;
}
