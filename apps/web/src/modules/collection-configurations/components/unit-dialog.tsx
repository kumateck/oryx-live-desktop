import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetConfigurationUnitQuery } from "../api/collection-api";
import { unitRecordSchema } from "../schemas/unit-schema";
import { UnitEditor } from "./unit-editor";

export function UnitDialog({ id, onClose }: { id?: string; onClose: () => void }) {
  const query = useGetConfigurationUnitQuery(id ?? "", { skip: !id });
  const parsed = query.currentData ? unitRecordSchema.safeParse(query.currentData) : null;
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The unit details could not be read safely." : null;
  if (!id || (parsed?.success && !error)) return <UnitEditor {...(parsed?.success ? { record: parsed.data } : {})} onClose={onClose} />;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>{id ? "Edit unit of measure" : "Add unit of measure"}</DialogTitle><DialogDescription>Define how quantities are recorded and priced.</DialogDescription></DialogHeader>
    <DialogBody>
      {error ? <div role="alert" className="space-y-2"><p>{error}</p><Button variant="outline" size="sm" onClick={() => { void query.refetch(); }}>Retry</Button></div>
        : <div className="h-60 animate-pulse rounded-lg bg-muted" aria-label="Loading unit details" />}
    </DialogBody>
  </DialogContent></Dialog>;
}
