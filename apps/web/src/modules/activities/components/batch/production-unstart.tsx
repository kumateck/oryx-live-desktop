import { lazy, Suspense, useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { unstartPermission } from "../../schemas/production-unstart";

const UnstartDialog = lazy(() => import("./production-unstart-dialog"));

export function ProductionUnstart({ activityId }: { activityId: string }) {
  const [open, setOpen] = useState(false);
  return <PermissionGuard require={unstartPermission}>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Undo2 />Unstart production</Button>
    {open ? <Suspense fallback={null}><UnstartDialog activityId={activityId} onClose={() => setOpen(false)} /></Suspense> : null}
  </PermissionGuard>;
}
