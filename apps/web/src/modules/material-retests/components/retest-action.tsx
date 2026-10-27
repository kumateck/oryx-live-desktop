import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { SettingsFormDialog } from "@/modules/settings-support/ui";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { utcBoundary } from "@/shared/format/date-boundary";
import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import { retestSchema, retestAudit as audit, retestPermissions as p, type MaterialRetest } from "../schemas/retest";

export type RetestAction = "approve" | "reject" | "sample" | "acknowledge" | "link";
interface Values { comments: string; password: string; quantity: number; containers: number; date: Date | null; reference: string }
export function RetestActionDialog({ record, action, onClose, onDone }: { record: MaterialRetest; action: RetestAction; onClose: () => void; onDone: () => void }) {
  const decision = action === "approve" || action === "reject";
  const command = useVerifiedMutation<MaterialRetest>(p[action], record);
  const [read] = qcApi.useLazyGetApiV1QcMaterialRetestsByIdQuery();
  const [pending] = qcApi.useLazyGetApiV1QcWorksheetsApprovalsMyPendingQuery();
  const [approve] = qcApi.usePostApiV1QcMaterialRetestsByIdApproveMutation();
  const [reject] = qcApi.usePostApiV1QcMaterialRetestsByIdRejectMutation();
  const [sample] = qcApi.usePostApiV1QcMaterialRetestsByIdSampleMutation();
  const [acknowledge] = qcApi.usePostApiV1QcMaterialRetestsByIdAcknowledgeMutation();
  const [link] = qcApi.usePostApiV1QcMaterialRetestsByIdTestRequestMutation();
  const [message, setMessage] = useState("");
  const schema = useMemo(() => z.object({
    comments: z.string().trim().max(1000).refine((value) => !decision || value.length >= 3, "Record your decision reason"),
    password: z.string().refine((value) => !decision || value.length > 0, "Enter your own password"),
    quantity: z.number().finite().refine((value) => action !== "sample" || value > 0, "Sample quantity must be positive"),
    containers: z.number().int().refine((value) => action !== "sample" || value > 0, "Record the number of sampled containers"),
    date: z.date().nullable().refine((value) => action !== "sample" || !!value && value.getTime() > Date.now() && (!record.originalExpiryDate || value.getTime() > new Date(record.originalExpiryDate).getTime()), "Proposed expiry must be after today and the original expiry"),
    reference: z.string().refine((value) => action !== "link" || z.uuid().safeParse(value).success, "Choose a valid QC test request ID"),
  }), [action, decision, record.originalExpiryDate]);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { comments: "", password: "", quantity: 0, containers: 0, date: null, reference: "" } });
  const fields: WizardField<Values>[] = decision ? [
    { type: InputTypes.PASSWORD, name: "password", label: "Your password", required: true },
    { type: InputTypes.TEXTAREA, name: "comments", label: "Decision reason", required: true },
  ] : action === "sample" ? [
    { type: InputTypes.NUMBER, name: "quantity", label: "Sample quantity (batch base unit)", step: 0.000001, min: 0, required: true },
    { type: InputTypes.NUMBER, name: "containers", label: "Sampled containers", step: 1, min: 1, required: true },
    { type: InputTypes.DATE, name: "date", label: "Proposed expiry", required: true },
  ] : action === "link" ? [{ type: InputTypes.TEXT, name: "reference", label: "QC test request ID", required: true, description: "The request must test this batch and material kind only." }] : [];
  const save = async (values: Values) => {
    const failure = await command.run(record, async () => {
      const fresh = retestSchema.parse(await read({ ...audit, id: record.id }, false).unwrap());
      if (decision) {
        const queue = await pending(audit, false).unwrap();
        if (!queue.some((item) => item.entityType === "MaterialRetest" && item.entityId === record.id)) throw new Error("This retest decision is no longer assigned to you.");
      }
      return fresh;
    }, async (fresh) => {
      const expected = decision ? 0 : action === "sample" ? 1 : action === "acknowledge" ? 2 : 3;
      if (fresh.status !== expected) throw new Error("This retest is no longer at the required stage.");
      const args = { ...audit, id: fresh.id };
      const body = { password: values.password, comments: values.comments };
      const result = action === "approve" ? await approve({ ...args, domainEntitiesMaterialsBatchMaterialRetestDecision: body })
        : action === "reject" ? await reject({ ...args, domainEntitiesMaterialsBatchMaterialRetestDecision: body })
        : action === "sample" && values.date ? await sample({ ...args, domainEntitiesMaterialsBatchRecordMaterialRetestSample: { sampleQuantity: values.quantity, sampledContainers: values.containers, proposedExpiryDate: utcBoundary(values.date) } })
        : action === "acknowledge" ? await acknowledge(args)
        : action === "link" ? await link({ ...args, domainEntitiesMaterialsBatchLinkMaterialRetestTestRequest: { testRequestId: values.reference } }) : null;
      if (!result) throw new Error("The action is incomplete.");
      if ("error" in result) throw new Error(apiErrorMessage(result.error));
    });
    if (decision) form.setValue("password", "");
    if (failure) setMessage(failure); else onDone();
  };
  const label = { approve: "Sign approval", reject: "Sign rejection", sample: "Record sample", acknowledge: "Acknowledge sample", link: "Link test request" }[action];
  return <SettingsFormDialog title={label} description="The current retest state, assignment and your permission are verified before saving. Expiry remains unchanged until a compliant linked COA is issued."
    form={form} fields={fields} saving={command.busy} submitDisabled={command.attempted || !command.allowed} message={message} submitLabel={label} onClose={onClose} onSubmit={save} />;
}
