import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePackingStyles, type PackingSaveTarget } from "../../hooks/use-packing-styles";
import { unitType, useUnitOptions } from "../../hooks/use-unit-options";
import type { PackingStyle } from "../../lib/packing-styles";
import { PackingStyleDialog } from "./packing-style-dialog";
import { PackingStylesTable } from "./packing-styles-table";

type Open = { mode: "add" } | { mode: "edit"; style: PackingStyle } | { mode: "remove"; style: PackingStyle } | null;

export function PackingStyleSection({ productId, fullBatchSize, baseUnit, saveAs = "product" }: {
  productId: string; fullBatchSize: number | null; baseUnit: string | null;
  /** Which endpoint and permission saves the styles: the product edit page, or approved products in the finished goods warehouse. */
  saveAs?: PackingSaveTarget;
}) {
  const packing = usePackingStyles(productId, saveAs);
  const units = useUnitOptions();
  const [open, setOpen] = useState<Open>(null);
  const onEdit = useCallback((style: PackingStyle) => setOpen({ mode: "edit", style }), []);
  const onRemove = useCallback((style: PackingStyle) => setOpen({ mode: "remove", style }), []);

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <UnsavedChangesGuard when={packing.dirty} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Packing styles</h2>
        <p className="text-xs text-muted-foreground">{packing.dirty ? "You have changes that are not saved yet." : "The ways this product is packed. One style is the default."}</p></div>
      {packing.canEdit ? <div className="flex flex-wrap gap-2">
        {packing.dirty ? <Button type="button" size="sm" variant="ghost" disabled={packing.saving} onClick={packing.discard}>Discard changes</Button> : null}
        <Button type="button" size="sm" variant="outline" disabled={units.loading || Boolean(units.error)} onClick={() => setOpen({ mode: "add" })}><Plus />Add style</Button>
        <Button type="button" size="sm" disabled={!packing.dirty || packing.saving} onClick={() => void packing.saveAll()}>
          {packing.saving ? <><Spinner />Saving…</> : "Save packing styles"}</Button>
      </div> : null}
    </div>
    {units.error && packing.canEdit ? <p role="alert" className="flex flex-wrap items-center gap-2 text-sm">Units of measure could not be loaded, so styles cannot be added or edited. {units.error}
      <Button type="button" size="xs" variant="outline" onClick={units.retry}>Retry</Button></p> : null}
    {packing.saveError ? <p role="alert" className="text-sm text-destructive">{packing.saveError}</p> : null}
    <PackingStylesTable styles={packing.styles} baseUnit={baseUnit} loading={packing.loading} error={packing.error} onRetry={packing.retry} require={packing.require} onEdit={onEdit} onRemove={onRemove} />

    {open?.mode === "add" || open?.mode === "edit" ? <PackingStyleDialog key={open.mode === "edit" ? open.style.key : "new"}
      editing={open.mode === "edit" ? open.style : null} styles={packing.styles} packingUnits={units.ofType(unitType.packing)} allUnits={units.all}
      fullBatchSize={fullBatchSize} baseUnit={baseUnit} onClose={() => setOpen(null)}
      onSubmit={(values) => { if (open.mode === "edit") packing.update(open.style.key, values); else packing.add(values); setOpen(null); }} /> : null}

    {open?.mode === "remove" ? <Dialog open onOpenChange={(next) => { if (!next) setOpen(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Remove {open.style.name}?</DialogTitle>
          <DialogDescription>It is removed when you save the packing styles. A style already used in batch packaging records cannot be removed; the save will say so.</DialogDescription></DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={() => { packing.remove(open.style.key); setOpen(null); }}>Remove</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog> : null}
  </section>;
}
