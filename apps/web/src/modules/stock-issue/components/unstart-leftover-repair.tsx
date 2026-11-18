import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { leftoverRepairPermissions } from "../schemas/unstart-leftovers";

const Dialog = lazy(() => import("./unstart-leftover-repair-dialog"));

export function UnstartLeftoverRepair({ kind }: { kind: 0 | 1 }) {
  const [open, setOpen] = useState(false);
  return <PermissionGuard require={leftoverRepairPermissions[kind]}>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Repair Unstart leftovers</Button>
    {open ? <Suspense fallback={null}><Dialog kind={kind} onClose={() => setOpen(false)} /></Suspense> : null}
  </PermissionGuard>;
}
