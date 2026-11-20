import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthYearPicker } from "@/shared/date-pickers/month-year-picker";
import { OptionPicker } from "@/shared/datatable/components/option-picker";
import type { DomainEntitiesApprovedVendorListsApprovedVendorMappingDto as Mapping, DomainEntitiesApprovedVendorListsApprovedVendorOptionsDto as Options } from "@/shared/api/generated/procurement";
import { useLazyVendorMappingsQuery } from "../api/avl-api";
import { lineProblem, materialLabel, type DraftLine } from "../lib/avl";
import { avlAudit } from "../lib/keys";
import { randomId } from "@/shared/ids/random-id";

const blank = (): DraftLine => ({ key: randomId(), materialId: "", materialLabel: "", manufacturer: { id: null, name: "", address: null },
  supplier: { id: null, name: "", address: null, type: 1 }, quantityPerPack: "", approvalMonth: "", validityMonth: "" });

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: string | null }) {
  return <div className="min-w-0 space-y-1.5">{htmlFor ? <Label htmlFor={htmlFor}>{label}</Label> : <p className="text-sm font-medium">{label}</p>}{children}
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
function ModeSwitch({ entering, onChange, what }: { entering: boolean; onChange: (entering: boolean) => void; what: string }) {
  return <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => onChange(!entering)}>{entering ? `Choose an existing ${what}` : `Enter a new ${what}`}</Button>;
}

/** Adds or changes one line. Manufacturers and suppliers already mapped to the material are offered first. */
export function LineDialog({ line, others, options, onSave, onClose }: {
  line: DraftLine | null; others: readonly DraftLine[]; options: Options; onSave: (line: DraftLine) => void; onClose: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<DraftLine>(() => line ?? blank());
  const [loadMappings, mappingsQuery] = useLazyVendorMappingsQuery();
  useEffect(() => { if (draft.materialId) void loadMappings({ ...avlAudit, materialId: draft.materialId }, true); }, [draft.materialId, loadMappings]);
  const mappings: readonly Mapping[] = mappingsQuery.data ?? [];
  const mapped = mappings.find((item) => item.manufacturerId === draft.manufacturer.id) ?? null;
  const manufacturerOptions = useMemo(() => {
    const first = mappings.map((item) => ({ value: item.manufacturerId ?? "", label: `${item.manufacturerName ?? "Unnamed"} · mapped` }));
    return [...first, ...(options.manufacturers ?? []).filter((item) => !mappings.some((m) => m.manufacturerId === item.id))
      .map((item) => ({ value: item.id ?? "", label: item.name ?? "Unnamed" }))].filter((item) => item.value);
  }, [mappings, options.manufacturers]);
  const supplierOptions = useMemo(() => {
    const first = (mapped?.suppliers ?? []).map((item) => ({ value: item.supplierId ?? "", label: `${item.supplierName ?? "Unnamed"} · mapped` }));
    return [...first, ...(options.suppliers ?? []).filter((item) => !mapped?.suppliers?.some((s) => s.supplierId === item.id))
      .map((item) => ({ value: item.id ?? "", label: item.name ?? "Unnamed" }))].filter((item) => item.value);
  }, [mapped, options.suppliers]);
  const materialOptions = useMemo(() => (options.materials ?? []).flatMap((item) => item.id ? [{ value: item.id, label: materialLabel(item.code ?? null, item.name ?? null) }] : []), [options.materials]);
  const set = (change: Partial<DraftLine>) => setDraft((current) => ({ ...current, ...change }));
  const problem = lineProblem(draft, others);
  const [shown, setShown] = useState(false);
  const enteringManufacturer = draft.manufacturer.id === null;
  const enteringSupplier = draft.supplier.id === null;
  const entered = draft.supplier.id === null ? draft.supplier : { id: null, name: "", address: null, type: 1 as const };
  const enter = (change: Partial<Pick<typeof entered, "name" | "address" | "type">>) => set({ supplier: { ...entered, ...change } });
  const unmappedManufacturer = Boolean(draft.materialId && draft.manufacturer.id && mappingsQuery.isSuccess && !mapped);
  const unmappedSupplier = Boolean(draft.supplier.id && mappingsQuery.isSuccess && !mapped?.suppliers?.some((s) => s.supplierId === draft.supplier.id));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>{line ? "Change material" : "Add material"}</DialogTitle>
        <DialogDescription>Choose from the mappings already recorded, or enter a new manufacturer or supplier: saving the list creates it and maps it to the material.</DialogDescription></DialogHeader>
      <DialogBody className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Material">
          <OptionPicker label="Material" options={materialOptions} selected={draft.materialId ? [draft.materialId] : []} multiple={false} placeholder="Choose a raw material" emptyText="No raw material matches"
            onPick={(value) => set({ materialId: value, materialLabel: materialOptions.find((o) => o.value === value)?.label ?? "", manufacturer: { id: null, name: "", address: null }, supplier: { id: null, name: "", address: null, type: 1 } })} onClear={null} />
        </Field></div>
        <Field label="Manufacturer" hint={unmappedManufacturer ? "Not mapped to this material yet: saving maps it." : draft.manufacturer.address}>
          {enteringManufacturer ? <div className="space-y-2">
            <Input aria-label="New manufacturer name" placeholder="Name" value={draft.manufacturer.name} onChange={(e) => set({ manufacturer: { id: null, name: e.target.value, address: draft.manufacturer.address } })} />
            <Input aria-label="New manufacturer address" placeholder="Address" value={draft.manufacturer.address ?? ""} onChange={(e) => set({ manufacturer: { id: null, name: draft.manufacturer.name, address: e.target.value } })} /></div>
            : <OptionPicker label="Manufacturer" options={manufacturerOptions} selected={draft.manufacturer.id ? [draft.manufacturer.id] : []} multiple={false} placeholder="Choose a manufacturer" emptyText="No manufacturer matches" loading={mappingsQuery.isFetching}
              onPick={(value) => { const found = options.manufacturers?.find((m) => m.id === value); const map = mappings.find((m) => m.manufacturerId === value);
                set({ manufacturer: { id: value, name: found?.name ?? map?.manufacturerName ?? "Unnamed", address: found?.address ?? map?.manufacturerAddress ?? null },
                  ...(draft.quantityPerPack || map?.quantityPerPack == null ? {} : { quantityPerPack: String(map.quantityPerPack) }) }); }} onClear={null} />}
          <ModeSwitch what="manufacturer" entering={enteringManufacturer} onChange={(entering) => set({ manufacturer: entering ? { id: null, name: "", address: null } : { id: "", name: "", address: null } })} />
        </Field>
        <Field label="Supplier" hint={unmappedSupplier ? "Not mapped to supply this material from this manufacturer yet: saving maps it." : null}>
          {enteringSupplier ? <div className="space-y-2">
            <Input aria-label="New supplier name" placeholder="Name" value={draft.supplier.name} onChange={(e) => enter({ name: e.target.value })} />
            <Input aria-label="New supplier address" placeholder="Address" value={entered.address ?? ""} onChange={(e) => enter({ address: e.target.value })} />
            <Select value={String(entered.type)} onValueChange={(value) => enter({ type: value === "0" ? 0 : 1 })}>
              <SelectTrigger aria-label="New supplier type" size="sm"><SelectValue /></SelectTrigger>
              <SelectContent position="popper"><SelectItem value="1">Local supplier</SelectItem><SelectItem value="0">Foreign supplier</SelectItem></SelectContent></Select></div>
            : <OptionPicker label="Supplier" options={supplierOptions} selected={draft.supplier.id ? [draft.supplier.id] : []} multiple={false} placeholder="Choose a supplier" emptyText="No supplier matches"
              onPick={(value) => set({ supplier: { id: value, name: options.suppliers?.find((s) => s.id === value)?.name ?? "Unnamed" } })} onClear={null} />}
          <ModeSwitch what="supplier" entering={enteringSupplier} onChange={(entering) => set({ supplier: entering ? { id: null, name: "", address: null, type: 1 } : { id: "", name: "" } })} />
        </Field>
        <Field label="Qty/Pack (kg)" htmlFor={`${id}-qty`}><Input id={`${id}-qty`} inputMode="decimal" value={draft.quantityPerPack} onChange={(e) => set({ quantityPerPack: e.target.value })} /></Field>
        <div />
        <Field label="Date of approval"><MonthYearPicker id={`${id}-approved`} label="Date of approval" value={draft.approvalMonth || null} onChange={(value) => set({ approvalMonth: value ?? "" })} /></Field>
        <Field label="Validity date"><MonthYearPicker id={`${id}-validity`} label="Validity date" value={draft.validityMonth || null} minMonth={draft.approvalMonth || undefined} onChange={(value) => set({ validityMonth: value ?? "" })} /></Field>
        {shown && problem ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{problem}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={() => { setShown(true); if (!problem) onSave(draft); }}>{line ? "Update line" : "Add line"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
