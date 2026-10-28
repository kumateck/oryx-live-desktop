import { useNavigate } from "react-router";
import { SettingsRecordState } from "@/modules/settings-support/ui";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { approvalSettingsApi, approvalSettingsAudit } from "../api/approval-settings-api";
import { approvalRecordSchema, approvalRepairRecordSchema } from "../schemas/approval-settings-schema";
import { ApprovalEditor } from "./approval-editor";

export function ApprovalEditPage({ id }: { id: string }) {
  const navigate = useNavigate();
  const close = () => { void navigate("/settings/approvals"); };
  const query = approvalSettingsApi.useGetApiV1ApprovalByApprovalIdQuery({ ...approvalSettingsAudit, approvalId: id });
  const parsed = query.currentData ? approvalRepairRecordSchema.safeParse(query.currentData) : null;
  const error = query.error ? apiErrorMessage(query.error) : parsed?.success === false ? "This workflow cannot be read without losing configuration." : null;
  if (error || !parsed?.success) return <SettingsRecordState title="Edit approval workflow" error={error} close={close} retry={() => { void query.refetch(); }} />;
  return <ApprovalEditor record={parsed.data} repairing={!approvalRecordSchema.safeParse(parsed.data).success} onClose={close} />;
}
