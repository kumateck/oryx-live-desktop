import { lazy, Suspense, useState } from "react";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { reservationRepairPermission } from "../../schemas/reservation-repair";

const RepairDialog = lazy(() => import("./reservation-repair-dialog"));

export function ReservationRepair({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false);
  return <PermissionGuard require={reservationRepairPermission}>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Wrench />Repair stock reservations</Button>
    {open ? <Suspense fallback={null}><RepairDialog batchId={batchId} onClose={() => setOpen(false)} /></Suspense> : null}
  </PermissionGuard>;
}
