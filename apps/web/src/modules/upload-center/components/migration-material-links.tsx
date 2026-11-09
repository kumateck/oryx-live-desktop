import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useCurrentUser } from "@/shared/auth/session-provider";
import type { MigrationDto } from "../api/stock-migration-api";
import { materialLinkRequirement, reviewMaterialLinksRequirement } from "../lib/migration-material-links";
import { isDraft } from "../lib/stock-migration";
import { MigrationMaterialLinkGroup } from "./migration-material-link-group";

export function MigrationMaterialLinks({ migration }: { migration: MigrationDto }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const user = useCurrentUser();
  if (!isDraft(migration)) return null;
  const sameDepartment = Boolean(user?.departmentId && user.departmentId === migration.departmentId);
  return <PermissionGuard require={reviewMaterialLinksRequirement}>
    <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><Link2 />Link missing materials</Button>
    {open ? <Dialog open onOpenChange={(next) => { if (!busy) setOpen(next); }}>
      <DialogContent className="sm:max-w-5xl" showCloseButton={!busy} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Link missing materials</DialogTitle>
          <DialogDescription>Review department links for {migration.departmentName}. Units come from the Excel rows and any row corrections. Select all, a subset, or one material in each group.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <p className="text-sm text-muted-foreground">PCS uses Piece. Mass uses mg with levels of 100 / 1,000 / 10,000 kg; liquid uses ml with levels of 100 / 1,000 / 10,000 L. Existing links are preserved. Linking checks the draft again without posting stock.</p>
          {!sameDepartment ? <p role="alert">Switch to {migration.departmentName}, the migration’s department, before linking materials.</p> : <>
            <PermissionGuard require={materialLinkRequirement(0)}><MigrationMaterialLinkGroup migration={migration} kind={0} busy={busy} onBusy={setBusy} /></PermissionGuard>
            <PermissionGuard require={materialLinkRequirement(1)}><MigrationMaterialLinkGroup migration={migration} kind={1} busy={busy} onBusy={setBusy} /></PermissionGuard>
          </>}
        </DialogBody>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog> : null}
  </PermissionGuard>;
}
