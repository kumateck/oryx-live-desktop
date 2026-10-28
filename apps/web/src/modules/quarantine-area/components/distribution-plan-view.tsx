import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { stockQuantity, type DistributionPlan, type WarehousePlan } from "../lib/distribution-plan";

export function DistributionPlanView({ plan, busy, onDistribute }: {
  plan: DistributionPlan;
  busy: string | null;
  onDistribute: (warehouse: WarehousePlan) => void;
}) {
  if (plan.problem) return <p role="alert" className="text-sm text-destructive">{plan.problem}</p>;
  return <div className="space-y-4">
    <dl className="grid gap-3 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Approved stock remaining</dt><dd className="font-medium">{stockQuantity(plan.available, plan.unit)}</dd></div>
      <div><dt className="text-muted-foreground">Warehouse requests outstanding</dt><dd className="font-medium">{stockQuantity(plan.requested, plan.unit)}</dd></div>
    </dl>
    {plan.warehouses.length === 0 ? <p className="text-sm text-muted-foreground">No outstanding warehouse requests for this material.</p> : null}
    {plan.warehouses.map((warehouse) => <section key={warehouse.id} aria-label={`Distribution to ${warehouse.name}`} className="space-y-3 rounded-md border p-3">
      <h3 className="break-words font-semibold">{warehouse.name}</h3>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Requested</dt><dd>{stockQuantity(warehouse.requested, plan.unit)}</dd></div>
        <div><dt className="text-muted-foreground">To distribute</dt><dd>{stockQuantity(warehouse.allocated, plan.unit)}</dd></div>
        <div><dt className="text-muted-foreground">Shortfall</dt><dd>{stockQuantity(warehouse.requested - warehouse.allocated, plan.unit)}</dd></div>
      </dl>
      <ul aria-label="Batch allocations" className="divide-y text-sm">
        {warehouse.allocations.map((allocation) => <li key={`${allocation.materialBatchId}-${allocation.distributedRequisitionItemId}`} className="flex flex-wrap justify-between gap-2 py-1.5">
          <span className="break-words">{allocation.batchNumber}</span><span>{stockQuantity(allocation.quantity, plan.unit)}</span>
        </li>)}
      </ul>
      {!warehouse.allocations.length ? <p className="text-sm text-muted-foreground">No approved stock remains for this warehouse.</p> : null}
      <Button type="button" size="sm" disabled={busy !== null || warehouse.allocated <= 0} onClick={() => onDistribute(warehouse)}>
        {busy === warehouse.id ? <><Spinner />Checking and distributing…</> : `Distribute to ${warehouse.name}`}
      </Button>
    </section>)}
  </div>;
}
