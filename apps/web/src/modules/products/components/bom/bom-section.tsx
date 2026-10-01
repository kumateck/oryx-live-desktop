import { useCallback, useState } from "react";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { useBom } from "../../hooks/use-bom";
import type { BomLine } from "../../lib/bom";
import { BomItemDialog } from "./bom-item-dialog";
import { BomLinesTable } from "./bom-table";

type Open = { mode: "add" } | { mode: "edit"; line: BomLine } | { mode: "remove"; line: BomLine } | { mode: "archive" } | null;

export function BomSection({ productId, compositionSize, batchSize }: { productId: string; compositionSize: number | null; batchSize: number | null }) {
  const bom = useBom(productId, compositionSize, batchSize);
  const [open, setOpen] = useState<Open>(null);
  const onEdit = useCallback((line: BomLine) => setOpen({ mode: "edit", line }), []);
  const onRemove = useCallback((line: BomLine) => setOpen({ mode: "remove", line }), []);
  const busy = bom.saving || bom.archiving;

  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <UnsavedChangesGuard when={bom.dirty} />
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">Bill of materials{bom.version !== null ? ` · version ${bom.version}` : ""}</h2>
        <p className="text-xs text-muted-foreground">{bom.dirty ? "You have changes that are not saved yet. Saving creates the next version."
          : "The raw materials in one composition unit, in the order they are used. Drag a row to change its step."}</p></div>
      <div className="flex flex-wrap gap-2">
        {bom.dirty ? <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={bom.discard}>Discard changes</Button> : null}
        {bom.hasSaved && !bom.dirty ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpen({ mode: "archive" })}><Archive />Archive</Button> : null}
        <Button type="button" size="sm" variant="outline" disabled={busy || bom.loading} onClick={() => setOpen({ mode: "add" })}><Plus />Add material</Button>
        <Button type="button" size="sm" disabled={!bom.dirty || busy} onClick={() => void bom.saveAll()}>{bom.saving ? <><Spinner />Saving…</> : "Save bill of materials"}</Button>
      </div>
    </div>
    {compositionSize && batchSize ? null : <p className="text-xs text-muted-foreground">Batch quantities cannot be shown until the product's composition quantity and full batch size are set on the Info section.</p>}
    {bom.message ? <p role="alert" className="text-sm text-destructive">{bom.message}</p> : null}
    <BomLinesTable lines={bom.lines} compositionSize={compositionSize} batchSize={batchSize} loading={bom.loading} error={bom.error} onRetry={bom.retry}
      disabled={busy} onReorder={bom.setLines} onEdit={onEdit} onRemove={onRemove} />

    {open?.mode === "add" || open?.mode === "edit" ? <BomItemDialog key={open.mode === "edit" ? open.line.key : "new"} editing={open.mode === "edit" ? open.line : null}
      lines={bom.lines} compositionSize={compositionSize} batchSize={batchSize} onClose={() => setOpen(null)}
      onSubmit={(values, facts) => {
        const line: BomLine = { key: open.mode === "edit" ? open.line.key : `new-${crypto.randomUUID()}`, material: values.material, baseQuantity: values.baseQuantity,
          grade: values.grade ?? "", substitutes: values.substitutes ?? [], ...facts };
        bom.setLines(open.mode === "edit" ? bom.lines.map((item) => item.key === line.key ? line : item) : [...bom.lines, line]);
        setOpen(null);
      }} /> : null}

    {open?.mode === "remove" ? <Dialog open onOpenChange={(next) => { if (!next) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Remove {open.line.material.label}?</DialogTitle>
        <DialogDescription>It is removed from the formula when you save the bill of materials.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(null)}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { bom.setLines(bom.lines.filter((line) => line.key !== open.line.key)); setOpen(null); }}>Remove</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}

    {open?.mode === "archive" ? <Dialog open onOpenChange={(next) => { if (!next && !bom.archiving) setOpen(null); }}><DialogContent>
      <DialogHeader><DialogTitle>Archive the bill of materials?</DialogTitle>
        <DialogDescription>The active formula is marked inactive and the product is left without one until a new bill of materials is saved. Batches cannot be planned from a product with no active formula.</DialogDescription></DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={bom.archiving} onClick={() => setOpen(null)}>Cancel</Button>
        <Button type="button" variant="destructive" disabled={bom.archiving} onClick={() => void bom.archiveActive().then((done) => { if (done) setOpen(null); })}>
          {bom.archiving ? <><Spinner />Archiving…</> : "Archive"}</Button>
      </DialogFooter>
    </DialogContent></Dialog> : null}
  </section>;
}
