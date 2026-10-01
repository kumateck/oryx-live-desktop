import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { useProductArds } from "../../hooks/use-product-ards";
import { productArdPermissions, productEditPath } from "../../lib/product-access";
import type { SavedArd } from "../../schemas/ard-schema";
import { ArdDialog, type ArdTarget } from "./ard-dialog";
import { ArdTable } from "./ard-table";

export function ArdSection({ productId }: { productId: string }) {
  const state = useProductArds(productId);
  const access = useAccess();
  const mayCreate = access.has(productArdPermissions.create);
  const mayEdit = access.has(productArdPermissions.edit);
  const [target, setTarget] = useState<ArdTarget | null>(null);
  const clearMessage = state.clearMessage;
  const open = useCallback((next: ArdTarget) => { clearMessage(); setTarget(next); }, [clearMessage]);
  const onEdit = useCallback((saved: SavedArd) => open({ saved }), [open]);
  const ready = !state.loading && !state.error;
  const blocked = state.choices.filter((choice) => !choice.source);

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Analytical raw data</h2>
        <p className="text-xs text-muted-foreground">One record for each test stage, built from the product's STP and that stage's specification.</p></div>
      {mayCreate && ready ? <div className="flex flex-wrap gap-2">{state.choices.filter((choice) => choice.source).map((choice) =>
        <Button key={choice.value} type="button" size="sm" variant="outline" onClick={() => { if (choice.source) open({ source: choice.source }); }}><Plus />Add {choice.label.toLowerCase()}</Button>)}</div> : null}
    </div>
    {mayCreate && ready && blocked.length ? <ul className="space-y-1 text-xs text-muted-foreground">{blocked.map((choice) =>
      <li key={choice.value}>{choice.label} cannot be added yet: it needs {choice.missing}.</li>)}
      <li>Set these up on the <Link className="text-primary underline-offset-2 hover:underline" to={productEditPath(productId, "stp")}>STP</Link> and Specification sections.</li></ul> : null}
    <ArdTable ards={state.ards} loading={state.loading} error={state.error} onRetry={state.retry} onEdit={mayEdit ? onEdit : null} />
    {target ? <ArdDialog key={"saved" in target ? target.saved.id : `new-${target.source.stage}`} target={target} saving={state.saving} message={state.message}
      onSave={state.save} onClose={() => setTarget(null)} /> : null}
  </section>;
}
