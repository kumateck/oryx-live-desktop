import { useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseNumberInput } from "@/shared/datatable";
import { baseUnitsPerPack, formatCount, matchingPackLevel, packsPerShipper, pluralUnit, splitPacks, unitName } from "../../lib/packing-hierarchy";
import type { PackingStyleFormValues } from "../../schemas/packing-style-schema";

const AUTO = "auto";

/**
 * Preview of the pack rule. The shipper is always the first unit row and packs per shipper is entered.
 * The pack is the unit level whose count per shipper matches it: picked automatically unless someone chooses one.
 * The pack choice is not saved yet.
 */
export function ShipperPackPreview({ form, baseUnit }: { form: UseFormReturn<PackingStyleFormValues>; baseUnit: string | null }) {
  const units = useWatch({ control: form.control, name: "units" }) ?? [];
  const baseLabel = useWatch({ control: form.control, name: "basePackingUom" })?.label;
  const entered = useWatch({ control: form.control, name: "packPerShipper" });
  const baseQuantity = useWatch({ control: form.control, name: "basePackingQuantity" });
  const [trial, setTrial] = useState("");
  /** Null means automatic: the pack follows the entered packs per shipper. */
  const [packChoice, setPackChoice] = useState<number | null>(null);

  const levels = Array.from({ length: units.length }, (_, offset) => offset + 1);
  const chosen = packChoice !== null && packChoice >= 1 && packChoice <= units.length ? packChoice : null;
  const matched = matchingPackLevel(units, entered);
  const packLevel = chosen ?? matched;
  const nameAt = (level: number) => (level === units.length ? unitName(baseLabel) : unitName(units[level]?.uom?.label));
  const levelLabel = (level: number) => {
    const name = nameAt(level) ?? (level === units.length ? "Base packing unit" : `Unit ${level + 1}`);
    const count = packsPerShipper(units, 0, level);
    return `${name}${level === units.length ? " (base unit)" : ""}${count !== null ? ` · ${formatCount(count)} per shipper` : ""}`;
  };
  const enteredText = typeof entered === "number" && Number.isFinite(entered) ? formatCount(entered) : null;
  const shipperName = unitName(units[0]?.uom?.label) ?? "shipper";
  const baseName = unitName(baseLabel) ?? "base packing unit";

  const perShipper = packLevel !== null ? packsPerShipper(units, 0, packLevel) : null;
  const perPack = packLevel !== null ? baseUnitsPerPack(units, packLevel) : null;
  const packName = packLevel !== null ? nameAt(packLevel) ?? "pack" : "pack";
  const productPerPack = perPack !== null && typeof baseQuantity === "number" && Number.isFinite(baseQuantity) ? perPack * baseQuantity : null;
  const steps = perShipper !== null && packLevel !== null ? units.slice(0, packLevel).map((unit) => formatCount(unit.quantity)) : [];

  return <section aria-label="Shipper and pack" className="space-y-3 rounded-lg border border-dashed p-3">
    <div className="space-y-1">
      <h3 className="text-sm font-medium">Shipper and pack <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">Preview</span></h3>
      <p className="text-sm leading-normal text-muted-foreground">
        The shipper is the first unit ({shipperName}). The pack is the unit that packs per shipper counts, picked automatically from the units unless you choose one. Anything short of a full shipper is loose packs.
      </p>
    </div>
    <label className="block space-y-1.5 text-sm font-medium md:w-1/2">
      <span>Pack is</span>
      <Select value={chosen === null ? AUTO : String(chosen)} onValueChange={(value) => setPackChoice(value === AUTO ? null : Number(value))}>
        <SelectTrigger aria-label="Pack is" className="w-full font-normal"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO}>{matched !== null ? `Automatic: ${nameAt(matched) ?? `Unit ${matched + 1}`}` : "Automatic: no match"}</SelectItem>
          {levels.map((level) => <SelectItem key={level} value={String(level)}>{levelLabel(level)}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
    {packLevel === null ? <div role="status" className="space-y-1 text-sm leading-normal text-amber-700 dark:text-amber-400">
      <p>{enteredText ? `No unit gives ${enteredText} packs per shipper.` : "Enter packs per shipper to find the pack."} Choose the pack or check the quantities.</p>
      <p data-testid="pack-options" className="text-muted-foreground">These units give: {levels.map((level) => {
        const count = packsPerShipper(units, 0, level);
        const name = nameAt(level);
        return count !== null && name ? `${formatCount(count)} ${count === 1 ? name : pluralUnit(name)}` : null;
      }).filter(Boolean).join(", ") || "nothing yet, fill in every unit and quantity"}.</p>
    </div> : null}
    {perShipper !== null && perPack !== null ? <ul data-testid="shipper-pack-result" className="space-y-1 text-sm leading-normal">
      <li>1 shipper ({shipperName}) = {steps.length > 1 ? `${steps.join(" × ")} = ` : ""}<strong>{formatCount(perShipper)} {perShipper === 1 ? "pack" : "packs"}</strong> ({perShipper === 1 ? packName : pluralUnit(packName)})</li>
      <li>1 pack ({packName}) = {formatCount(perPack)} {perPack === 1 ? baseName : pluralUnit(baseName)}{productPerPack !== null ? ` = ${formatCount(productPerPack)}${baseUnit ? ` ${baseUnit}` : ""} of product` : ""}</li>
    </ul> : packLevel !== null ? <p className="text-sm text-muted-foreground">Fill in every unit and quantity to work out packs per shipper.</p> : null}
    {perShipper !== null && perPack !== null ? <TrialSplit value={trial} onChange={setTrial} perShipper={perShipper} perPack={perPack} packName={packName} baseName={baseName} /> : null}
    {chosen !== null && perShipper !== null && entered !== perShipper ? <p className="flex flex-wrap items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
      Packs per shipper is {enteredText ?? "empty"}, but {pluralUnit(packName)} as the pack give {formatCount(perShipper)}.
      <Button type="button" size="xs" variant="outline" onClick={() => form.setValue("packPerShipper", perShipper, { shouldDirty: true, shouldValidate: true })}>Use {formatCount(perShipper)}</Button>
    </p> : null}
    <p className="text-xs text-muted-foreground">Preview only: the pack choice is not saved yet.</p>
  </section>;
}

/** For testing the rule: type a number of packs and see how many full shippers and loose packs it makes. */
function TrialSplit({ value, onChange, perShipper, perPack, packName, baseName }: {
  value: string; onChange: (value: string) => void; perShipper: number; perPack: number; packName: string; baseName: string;
}) {
  const total = parseNumberInput(value);
  const split = typeof total === "number" ? splitPacks(total, perShipper) : null;
  const packs = (amount: number) => `${formatCount(amount)} ${amount === 1 ? "pack" : "packs"}`;
  return <div className="space-y-1.5">
    <label htmlFor="trial-packs" className="text-sm font-medium">Try a quantity of packs</label>
    <div className="flex flex-wrap items-center gap-3">
      <Input id="trial-packs" inputMode="decimal" placeholder="For example 2000" className="w-40 text-right tabular-nums" value={value}
        onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} />
      {split && typeof total === "number" ? <p data-testid="trial-split" className="text-sm leading-normal">
        {packs(total)} = <strong>{formatCount(split.shippers)} {split.shippers === 1 ? "shipper" : "shippers"}</strong> + <strong>{formatCount(split.loose)} loose</strong>
        <span className="text-muted-foreground"> ({formatCount(split.shippers)} × {formatCount(perShipper)} + {formatCount(split.loose)}; {formatCount(total * perPack)} {total * perPack === 1 ? baseName : pluralUnit(baseName)} in all)</span>
      </p> : value.trim() ? <p className="text-sm text-destructive">Enter a number of {pluralUnit(packName)} of 0 or more.</p> : null}
    </div>
  </div>;
}
