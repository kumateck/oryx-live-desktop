import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useConfigCommand } from "../hooks/use-config-command";
import type { ConfigKind, ConfigRecord } from "../schemas/contracts";
import { configLabels } from "../schemas/editor-schema";
export function ConfigDialog({
  kind,
  original,
  onClose,
  children,
}: {
  kind: ConfigKind;
  original: ConfigRecord | null;
  onClose: () => void;
  children: (command: ReturnType<typeof useConfigCommand>) => ReactNode;
}) {
  const command = useConfigCommand(kind, original, onClose);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {original ? "Edit" : "Add"} · {configLabels[kind]}
          </DialogTitle>
          <DialogDescription>
            These values affect future payroll calculations. Verify the configured amounts, percentages and effective dates before saving.
          </DialogDescription>
        </DialogHeader>
        {children(command)}
      </DialogContent>
    </Dialog>
  );
}
export function ConfigFormBody({ children, busy, allowed, error }: { children: ReactNode; busy: boolean; allowed: boolean; error: string }) {
  return (
    <DialogBody>
      <fieldset disabled={busy || !allowed} className="space-y-4">
        {children}
      </fieldset>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </DialogBody>
  );
}
export function ConfigFooter({ busy, allowed, onClose }: { busy: boolean; allowed: boolean; onClose: () => void }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
        Cancel
      </Button>
      <Button disabled={busy || !allowed}>{busy ? "Saving…" : "Save configuration"}</Button>
    </DialogFooter>
  );
}
