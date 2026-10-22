import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { ConfirmActionDialog, TableMenu } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { itemRule } from "@/shared/inventory/stores";
import { itemSchema, inventoryAudit as audit, type InventoryItem } from "@/shared/inventory/contracts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { itemFilesApi } from "../api/files";
function Remove({ row, file, close }: { row: InventoryItem; file: InventoryItem["attachments"][number]; close: () => void }) {
  const gate = usePermissionAction(itemRule(row.store, "edit"));
  const sent = useRef(false);
  const [read] = inventoryApi.useLazyGetApiV1ItemsByIdQuery();
  const [remove] = itemFilesApi.useRemoveInventoryFileMutation();
  return (
    <ConfirmActionDialog
      title="Delete inventory attachment"
      description={`Remove ${file.name} from this item?`}
      require={itemRule(row.store, "edit")}
      confirmLabel="Delete attachment"
      busyLabel="Deleting…"
      onClose={close}
      onConfirm={async () => {
        const denied = gate.check();
        if (denied) return denied;
        if (sent.current) return "A deletion was already sent. Reopen the current attachment list before another attempt.";
        const actor = sessionUserId();
        if (!actor) return "Sign in before deleting an attachment.";
        const current = await read({ ...audit, id: row.id }, false);
        if (current.error) return apiErrorMessage(current.error);
        const parsed = itemSchema.safeParse(current.data);
        if (
          !parsed.success ||
          parsed.data.id !== row.id ||
          parsed.data.store !== row.store ||
          !file.reference ||
          !parsed.data.attachments.some((f) => f.id === file.id && f.reference === file.reference && f.link === file.link)
        )
          return "This attachment changed. Review the current item.";
        const revoked = gate.check();
        if (revoked) return revoked;
        if (sessionUserId() !== actor) return "The signed-in account changed. Reopen the item.";
        sent.current = true;
        const result = await remove({ id: row.id, reference: file.reference });
        return "error" in result ? apiErrorMessage(result.error) : null;
      }}
    />
  );
}
export function ItemAttachments({ row }: { row: InventoryItem }) {
  const [selected, setSelected] = useState<InventoryItem["attachments"][number] | null>(null);
  return (
    <section className="space-y-3">
      <AttachmentList title="Inventory attachments" files={row.attachments} />
      {row.attachments
        .filter((f) => f.reference)
        .map((file) => (
          <div className="flex items-center justify-between gap-3" key={file.id}>
            <span className="truncate text-muted-foreground">{file.name}</span>
            <TableMenu
              label={`Attachment actions for ${file.name}`}
              items={[
                {
                  id: "delete",
                  label: "Delete attachment",
                  icon: Trash2,
                  destructive: true,
                  require: itemRule(row.store, "edit"),
                  onSelect: () => setSelected(structuredClone(file)),
                },
              ]}
            />
          </div>
        ))}
      {selected ? <Remove row={row} file={selected} close={() => setSelected(null)} /> : null}
    </section>
  );
}
