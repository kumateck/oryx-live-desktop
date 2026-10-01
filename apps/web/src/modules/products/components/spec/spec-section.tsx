import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { useProductSpecifications, type SpecificationTarget } from "../../hooks/use-product-specifications";
import { productSpecificationPermissions } from "../../lib/product-access";
import type { SavedSpecification } from "../../schemas/specification-schema";
import { SpecificationDialog } from "./spec-dialog";
import { SpecificationTable } from "./spec-table";

export function SpecificationSection({ productId, division }: { productId: string; division: number | null }) {
  const state = useProductSpecifications(productId, division);
  const access = useAccess();
  const mayCreate = access.has(productSpecificationPermissions.create);
  const mayEdit = access.has(productSpecificationPermissions.edit);
  const [target, setTarget] = useState<SpecificationTarget | null>(null);
  const clearMessage = state.clearMessage;
  const open = useCallback((next: SpecificationTarget) => { clearMessage(); setTarget(next); }, [clearMessage]);
  const onEdit = useCallback((saved: SavedSpecification) => open({ saved }), [open]);

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Specifications</h2>
        <p className="text-xs text-muted-foreground">One specification for each test stage. Analytical raw data for a stage is built from its specification.</p></div>
      {mayCreate && !state.loading && !state.error ? <div className="flex flex-wrap gap-2">{state.openStages.map((stage) =>
        <Button key={stage.value} type="button" size="sm" variant="outline" onClick={() => open({ stage: stage.value })}><Plus />Add {stage.label.toLowerCase()}</Button>)}</div> : null}
    </div>
    <SpecificationTable specifications={state.specifications} loading={state.loading} error={state.error} onRetry={state.retry} onEdit={mayEdit ? onEdit : null} />
    {target ? <SpecificationDialog key={"saved" in target ? target.saved.id : `new-${target.stage}`} target={target} state={state} onClose={() => setTarget(null)} /> : null}
  </section>;
}
