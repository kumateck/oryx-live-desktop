import { lazy, Suspense, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { providerSchema, providerAudit as audit, type Provider } from "../schemas/provider";
import { useProviderCommand } from "../hooks/use-provider-command";
const Editor = lazy(() => import("./provider-editor").then((m) => ({ default: m.ProviderEditor })));
function Delete({ row, onClose }: { row: Provider; onClose: () => void }) {
  const command = useProviderCommand(row, "delete", () => {});
  return (
    <ConfirmActionDialog
      title="Delete contractor"
      description={`Remove ${row.name} from the active register? Deletion is refused if any current or historical job, quotation, invoice or memo references this contractor.`}
      require="CanDeleteContractors"
      confirmLabel="Delete contractor"
      busyLabel="Deleting…"
      onConfirm={() => command.run()}
      onClose={onClose}
    />
  );
}
function FrozenAction({ row, action, onClose }: { row: Provider; action: "edit" | "delete"; onClose: () => void }) {
  const [original] = useState(() => structuredClone(row));
  return action === "edit" ? (
    <Suspense fallback={<p role="status">Loading contractor editor…</p>}>
      <Editor original={original} onClose={onClose} />
    </Suspense>
  ) : (
    <Delete row={original} onClose={onClose} />
  );
}
function OpenAction({ id, action, onClose }: { id: string; action: "edit" | "delete"; onClose: () => void }) {
  const query = servicesApi.useGetApiV1ServiceProvidersByIdQuery({ ...audit, id }, { refetchOnMountOrArgChange: true });
  const parsed = providerSchema.safeParse(query.currentData);
  if (!query.isLoading && !query.error && parsed.success && parsed.data.id === id)
    return <FrozenAction key={id} row={parsed.data} action={action} onClose={onClose} />;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Service provider</DialogTitle>
          <DialogDescription>Reading complete contractor details before making changes.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {query.isLoading ? (
            <DetailPageSkeleton label="Loading contractor" groups={2} />
          ) : (
            <div role="alert">
              <p>{query.error ? apiErrorMessage(query.error) : "The contractor could not be verified."}</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Retry
              </Button>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
export function ProviderActions({ id, name }: { id: string; name: string }) {
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  return (
    <>
      <TableMenu
        label={`Actions for ${name}`}
        items={[
          { id: "edit", label: "Edit contractor", icon: Pencil, require: "CanEditContractors", onSelect: () => setAction("edit") },
          { id: "delete", label: "Delete contractor", icon: Trash2, destructive: true, require: "CanDeleteContractors", onSelect: () => setAction("delete") },
        ]}
      />
      {action ? <OpenAction id={id} action={action} onClose={() => setAction(null)} /> : null}
    </>
  );
}
