import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { reservationRepairPermissions } from "../schemas/unstart-reservations";

const RepairDialog = lazy(() => import("./unstart-reservation-repair-dialog"));
export function UnstartReservationRepair({ materialId, kind }: { materialId: string; kind: 0 | 1 }) {
  const [open, setOpen] = useState(false);
  return <PermissionGuard require={reservationRepairPermissions[kind]}>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Repair Unstart reservations</Button>
    {open ? <Suspense fallback={null}><RepairDialog materialId={materialId} kind={kind} onClose={() => setOpen(false)} /></Suspense> : null}
  </PermissionGuard>;
}
