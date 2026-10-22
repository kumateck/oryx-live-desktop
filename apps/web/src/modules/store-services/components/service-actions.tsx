import { lazy, Suspense, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { servicesApi } from "@/shared/api/generated/services";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { serviceSchema, servicesAudit as audit, type StoreService } from "@/shared/services/contracts";
const Editor = lazy(() => import("./service-editor").then((m) => ({ default: m.ServiceEditor })));
function Delete({ row, onClose }: { row: StoreService; onClose: () => void }) {
  const gate = usePermissionAction({ kind: "all", permissions: ["CanDeleteService", "CanViewServices"] });
  const [read] = servicesApi.useLazyGetApiV1ServicesByIdQuery();
  const [remove] = servicesApi.useDeleteApiV1ServicesByIdMutation();
  return (
    <ConfirmActionDialog
      title="Delete service"
      description={`Remove ${row.name} from the service register? The backend keeps a soft-deletion audit record. It does not check for linked contractor or job records.`}
      require="CanDeleteService"
      confirmLabel="Delete service"
      busyLabel="Deleting…"
      onClose={onClose}
      onConfirm={async () => {
        const denied = gate.check();
        if (denied) return denied;
        const fresh = await read({ ...audit, id: row.id }, false);
        if (fresh.error) return apiErrorMessage(fresh.error);
        if (JSON.stringify(serviceSchema.parse(fresh.data)) !== JSON.stringify(row)) return "This service changed. Reopen it before deleting.";
        const revoked = gate.check();
        if (revoked) return revoked;
        const result = await remove({ ...audit, id: row.id });
        return "error" in result ? apiErrorMessage(result.error) : null;
      }}
    />
  );
}
export function ServiceActions({ row, onChanged = () => {} }: { row: StoreService; onChanged?: () => void }) {
  const [selected, setSelected] = useState<{ row: StoreService; action: "edit" | "delete" } | null>(null);
  const close = () => {
    setSelected(null);
    onChanged();
  };
  return (
    <>
      <TableMenu
        label={`Actions for ${row.name}`}
        items={[
          {
            id: "edit",
            label: "Edit service",
            icon: Pencil,
            require: "CanEditService",
            onSelect: () => setSelected({ row: structuredClone(row), action: "edit" }),
          },
          {
            id: "delete",
            label: "Delete service",
            icon: Trash2,
            destructive: true,
            require: "CanDeleteService",
            onSelect: () => setSelected({ row: structuredClone(row), action: "delete" }),
          },
        ]}
      />
      {selected?.action === "edit" ? (
        <Suspense fallback={<p role="status">Loading service editor…</p>}>
          <Editor original={selected.row} onClose={close} />
        </Suspense>
      ) : selected ? (
        <Delete row={selected.row} onClose={close} />
      ) : null}
    </>
  );
}
