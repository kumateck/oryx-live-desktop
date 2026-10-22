import { useState } from "react";
import { Trash2 } from "lucide-react";
import { servicesApi } from "@/shared/api/generated/services";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { serviceSchema, servicesAudit as audit, type StoreService } from "@/shared/services/contracts";
import { serviceFilesApi } from "../api/service-files";
export function ServiceAttachments({ row }: { row: StoreService }) {
  const [selected, setSelected] = useState<StoreService["attachments"][number] | null>(null);
  const gate = usePermissionAction({ kind: "all", permissions: ["CanViewServices", "CanEditService"] });
  const [read] = servicesApi.useLazyGetApiV1ServicesByIdQuery();
  const [remove] = serviceFilesApi.useRemoveServiceFileMutation();
  return (
    <section className="space-y-3">
      <AttachmentList title="Service attachments" files={row.attachments} />
      {row.attachments.map((file) => (
        <div className="flex items-center justify-between gap-3" key={file.id}>
          <span className="truncate text-muted-foreground">{file.name}</span>
          <TableMenu
            label={`Attachment actions for ${file.name}`}
            items={
              file.reference
                ? [
                    {
                      id: "remove",
                      label: "Delete attachment",
                      icon: Trash2,
                      destructive: true,
                      require: "CanEditService",
                      onSelect: () => setSelected(structuredClone(file)),
                    },
                  ]
                : []
            }
          />
        </div>
      ))}
      {selected ? (
        <ConfirmActionDialog
          title="Delete service attachment"
          description={`Remove ${selected.name} from this service? The server retains an attachment deletion audit record.`}
          require="CanEditService"
          confirmLabel="Delete attachment"
          busyLabel="Deleting…"
          onClose={() => setSelected(null)}
          onConfirm={async () => {
            const denied = gate.check();
            if (denied) return denied;
            const result = await read({ ...audit, id: row.id }, false);
            if (result.error) return apiErrorMessage(result.error);
            const fresh = serviceSchema.parse(result.data);
            if (
              fresh.id !== row.id ||
              !selected.reference ||
              !fresh.attachments.some((f) => f.id === selected.id && f.reference === selected.reference && f.link === selected.link)
            )
              return "This attachment changed. Close and review the current file list.";
            const revoked = gate.check();
            if (revoked) return revoked;
            const removed = await remove({ id: row.id, reference: selected.reference });
            return "error" in removed ? apiErrorMessage(removed.error) : null;
          }}
        />
      ) : null}
    </section>
  );
}
