import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import type { CoaItemBody } from "../api/routines-api";

/** Which worksheet fields appear on the certificate, and how each row reads there. Every field is still tested. */
export function CoaItemsEditor({ items, onChange, problems }: { items: readonly CoaItemBody[]; onChange: (items: CoaItemBody[]) => void; problems: ReadonlyMap<number, string> }) {
  const set = (index: number, patch: Partial<CoaItemBody>) => onChange(items.map((item, at) => at === index ? { ...item, ...patch } : item));
  if (items.length === 0) return <p className="text-sm text-muted-foreground">The worksheet has no fields.</p>;
  return <ul className="space-y-2">{items.map((item, index) => {
    const id = `coa-${item.formFieldId}`;
    return <li key={item.formFieldId} className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2"><Switch id={id} checked={item.includeOnCoa} onCheckedChange={(checked) => set(index, { includeOnCoa: checked })} />
        <Label htmlFor={id} className="font-medium">{item.displayLabel || "Worksheet field"}</Label></div>
      {item.includeOnCoa ? <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1 text-sm">Certificate label<Input value={item.displayLabel} onChange={(event) => set(index, { displayLabel: event.target.value })} /></label>
        <label className="space-y-1 text-sm">Group<Input value={item.groupName} onChange={(event) => set(index, { groupName: event.target.value })} /></label>
        <label className="space-y-1 text-sm md:col-span-2">Specification or limit<Textarea rows={2} value={richTextToPlain(item.specificationText)} onChange={(event) => set(index, { specificationText: event.target.value })} /></label>
        <label className="space-y-1 text-sm">Unit<Input value={item.unit} onChange={(event) => set(index, { unit: event.target.value })} /></label>
        <label className="space-y-1 text-sm">Reference<Input value={item.reference} onChange={(event) => set(index, { reference: event.target.value })} /></label>
      </div> : null}
      {problems.get(index) ? <p role="alert" className="text-sm text-destructive">{problems.get(index)}</p> : null}
    </li>;
  })}</ul>;
}
