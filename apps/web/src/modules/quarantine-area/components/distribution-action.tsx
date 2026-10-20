import { lazy, Suspense, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { approvedMaterials } from "../lib/distribution-plan";
import { distributePermissions, quarantinePermissions } from "../lib/quarantine";
import type { Grn } from "../schemas/grn-schema";

const DistributeDialog = lazy(() => import("./distribute-dialog"));

export function DistributionAction({ grn, refreshing }: { grn: Grn; refreshing: boolean }) {
  const [open, setOpen] = useState<MaterialKind | null>(null);
  const kinds = ([0, 1] as const).filter((kind) => grn.batches.some((batch) => batch.materialKind === kind));
  return <>{kinds.map((kind) => <PermissionGuard key={kind} require={{ kind: "all", permissions: [quarantinePermissions[kind], distributePermissions[kind]] }}>
    <Button size="sm" disabled={refreshing || approvedMaterials(grn, kind).length === 0} onClick={() => setOpen(kind)}>
      <Truck />{kinds.length === 1 ? "Distribute" : `Distribute ${kind === 0 ? "raw" : "packaging"} materials`}
    </Button>
    {open === kind ? <Suspense fallback={<span role="status" className="text-sm text-muted-foreground">Loading distribution…</span>}>
      <DistributeDialog grn={grn} kind={kind} onClose={() => setOpen(null)} />
    </Suspense> : null}
  </PermissionGuard>)}</>;
}
