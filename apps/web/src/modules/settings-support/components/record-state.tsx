import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";

export function SettingsRecordState({ title, error, retry, close }: { title: string; error?: string | null; retry?: () => void; close: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Read the current configuration before editing.</DialogDescription></DialogHeader>
    <DialogBody>{error ? <div role="alert" className="space-y-3"><p>{error}</p>{retry ? <Button variant="outline" onClick={retry}>Retry</Button> : null}</div> : <FormPageSkeleton label={`Loading ${title.toLowerCase()}`} sections={[4]} />}</DialogBody>
  </DialogContent></Dialog>;
}
