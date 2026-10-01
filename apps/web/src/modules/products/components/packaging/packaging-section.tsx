import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { usePackaging } from "../../hooks/use-packaging";
import { usePackingStyles } from "../../hooks/use-packing-styles";
import type { PackagingLine } from "../../lib/packaging";
import { PackagingItemDialog } from "./packaging-item-dialog";
import { PackagingLinesTable } from "./packaging-table";

type Open = { mode: "add" } | { mode: "edit"; line: PackagingLine } | { mode: "remove"; line: PackagingLine } | null;

export function PackagingSection({ productId }: { productId: string }) {
  const packaging = usePackaging(productId);
  const packing = usePackingStyles(productId);
  const [open, setOpen] = useState<Open>(null);
  const onEdit = useCallback((line: PackagingLine) => setOpen({ mode: "edit", line }), []);
  const onRemove = useCallback((line: PackagingLine) => setOpen({ mode: "remove", line }), []);
  // Only saved packing styles have an ID a packing material can point to.
  const styleOptions = useMemo(() => packing.styles.flatMap((style) => style.id ? [{ value: style.id, label: style.name }] : []), [packing.styles]);

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <UnsavedChangesGuard when={packaging.dirty} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Packing materials</h2>
        <p className="text-xs text-muted-foreground">{packaging.dirty ? "You have changes that are not saved yet."
          : "The materials the product is packed in, for all packing styles or for one."}</p></div>
      <div className="flex flex-wrap gap-2">
        {packaging.dirty ? <Button type="button" size="sm" variant="ghost" disabled={packaging.saving} onClick={packaging.discard}>Discard changes</Button> : null}
        <Button type="button" size="sm" variant="outline" disabled={packaging.saving || packaging.loading} onClick={() => setOpen({ mode: "add" })}><Plus />Add material</Button>
        <Button type="button" size="sm" disabled={!packaging.dirty || packaging.saving} onClick={() => void packaging.saveAll()}>
          {packaging.saving ? <><Spinner />Saving…</> : "Save packing materials"}</Button>
      </div>
    </div>
    {packaging.message ? <p role="alert" className="text-sm text-destructive">{packaging.message}</p> : null}
    <PackagingLinesTable lines={packaging.lines} loading={packaging.loading} error={packaging.error} onRetry={packaging.retry} onEdit={onEdit} onRemove={onRemove} />

    {open?.mode === "add" || open?.mode === "edit" ? <PackagingItemDialog key={open.mode === "edit" ? open.line.key : "new"}
      editing={open.mode === "edit" ? open.line : null} lines={packaging.lines} packingStyles={styleOptions} onClose={() => setOpen(null)}
      onSubmit={(values, facts) => {
        const previous = open.mode === "edit" ? open.line : null;
        const sameMaterial = previous?.material.value === values.material.value;
        const line: PackagingLine = {
          key: previous?.key ?? `new-${crypto.randomUUID()}`, material: values.material, packing: values.packing ?? null,
          prescribedQuantity: values.prescribedQuantity, packingExcessMargin: values.packingExcessMargin ?? 0,
          code: facts?.code ?? (sameMaterial ? previous?.code ?? "" : ""),
          specification: facts ? facts.specification : sameMaterial ? previous?.specification ?? null : null,
          // Fields this page does not edit are kept for the same material and start from defaults for a new one.
          carried: sameMaterial && previous ? previous.carried : { baseQuantity: 1, unitCapacity: 0, baseUoMId: facts?.unit.id || null },
        };
        packaging.setLines(previous ? packaging.lines.map((item) => item.key === line.key ? line : item) : [...packaging.lines, line]);
        setOpen(null);
      }} /> : null}

    {open?.mode === "remove" ? <Dialog open onOpenChange={(next) => { if (!next) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Remove {open.line.material.label}?</DialogTitle>
        <DialogDescription>It is removed from the product when you save the packing materials.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { packaging.setLines(packaging.lines.filter((line) => line.key !== open.line.key)); setOpen(null); }}>Remove</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}
  </section>;
}
