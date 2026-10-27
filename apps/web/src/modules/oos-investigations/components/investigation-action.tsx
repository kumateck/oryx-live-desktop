import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { investigationAudit as audit, investigationForm, investigationReviewForm, investigationSchema, type Investigation, type InvestigationValues } from "../schemas/investigation";

export type InvestigationAction = "edit" | "submit" | "approve" | "reject";
const editFields: WizardField<InvestigationValues>[] = [
  { type: InputTypes.RICHTEXT, name: "investigationDetails", label: "Investigation findings", required: true, rows: 4 },
  { type: InputTypes.RICHTEXT, name: "rootCauseAnalysis", label: "Root cause analysis", required: true, rows: 4 },
  { type: InputTypes.RICHTEXT, name: "correctiveActions", label: "Corrective actions", required: true, rows: 4 },
  { type: InputTypes.RICHTEXT, name: "preventiveActions", label: "Preventive actions", required: true, rows: 4 },
];
const reviewFields: WizardField<InvestigationValues>[] = [{ type: InputTypes.TEXTAREA, name: "comments", label: "QA decision reason", required: true, rows: 4 }];
export function InvestigationActionDialog({ record, action, onClose, onDone }: { record: Investigation; action: InvestigationAction; onClose: () => void; onDone: () => void }) {
  const reviewing = action === "approve" || action === "reject";
  const command = useVerifiedMutation<Investigation>(reviewing ? "CanReviewOosInvestigation" : "CanSubmitOosInvestigation", record);
  const [read] = analyticalApi.useLazyGetApiV1QaOosInvestigationsByIdQuery();
  const [update] = analyticalApi.usePutApiV1QaOosInvestigationsByIdMutation();
  const [submit] = analyticalApi.usePutApiV1QaOosInvestigationsByIdSubmitMutation();
  const [review] = analyticalApi.usePutApiV1QaOosInvestigationsByIdQaReviewMutation();
  const [message, setMessage] = useState("");
  const form = useForm<InvestigationValues>({ resolver: zodResolver(reviewing ? investigationReviewForm : investigationForm), defaultValues: { ...record, comments: "" } });
  const save = async (values: InvestigationValues) => {
    if (reviewing && values.comments.length < 3) { form.setError("comments", { message: "Record the reason for this QA decision" }); return; }
    const failure = await command.run(record, async () => investigationSchema.parse(await read({ ...audit, id: record.id }, false).unwrap()), async (fresh) => {
      if (fresh.status !== (reviewing ? 1 : 0)) throw new Error("The investigation is no longer at this stage.");
      const args = { ...audit, id: record.id };
      const result = action === "edit" ? await update({ ...args, domainEntitiesOosInvestigationsUpdateOosInvestigationRequest: {
        productOrMaterialName: fresh.productOrMaterialName, batchNumber: fresh.batchNumber,
        rootCauseAnalysis: values.rootCauseAnalysis, correctiveActions: values.correctiveActions,
        preventiveActions: values.preventiveActions, investigationDetails: values.investigationDetails,
      } }) : action === "submit" ? await submit(args) : await review({ ...args,
        domainEntitiesOosInvestigationsReviewOosInvestigationRequest: { approve: action === "approve", comments: values.comments },
      });
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
    if (failure) setMessage(failure); else onDone();
  };
  const labels = { edit: "Save investigation", submit: "Submit to QA", approve: "Approve investigation", reject: "Permanently reject" };
  return <SettingsFormDialog title={labels[action]} description={action === "reject" ? "This records a final rejection of the linked material or product test. Review the complete investigation before confirming."
    : "Current evidence, state and your permission are verified before this action is recorded."}
    form={form} fields={action === "edit" ? editFields : reviewing ? reviewFields : []} saving={command.busy} submitDisabled={command.attempted || !command.allowed}
    message={message} submitLabel={labels[action]} onClose={onClose} onSubmit={save} />;
}
