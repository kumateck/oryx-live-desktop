import { alertApi, alertAudit } from "../api/alert-api";
import { alertRecordSchema } from "../schemas/alert-schema";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { SettingsRecordState } from "@/modules/settings-support/ui";
import { AlertEditor } from "./alert-editor";

export function EditAlert({ id, recipientsOnly, onClose }: { id: string; recipientsOnly: boolean; onClose: () => void }) {
  const query = alertApi.useGetApiV1AlertByAlertIdQuery({ ...alertAudit, alertId: id });
  const parsed = query.currentData ? alertRecordSchema.safeParse(query.currentData) : null;
  const error = query.error ? apiErrorMessage(query.error) : parsed?.success === false ? "This alert cannot be read safely." : null;
  if (error || !parsed?.success) return <SettingsRecordState title="Edit alert" error={error} close={onClose} retry={() => { void query.refetch(); }} />;
  if (!parsed.data.isConfigurable && !recipientsOnly) return <SettingsRecordState title="System alert" error="This alert is managed by the system. You can change its recipients, or enable or disable its delivery, from the list." close={onClose} />;
  return <AlertEditor record={parsed.data} recipientsOnly={recipientsOnly} onClose={onClose} />;
}
