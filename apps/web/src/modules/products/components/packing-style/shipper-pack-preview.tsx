import { useEffect, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { baseUnitsPerPack, formatCount, matchingPackLevel, packsPerShipper, pluralUnit, unitName } from "../../lib/packing-hierarchy";
import type { PackingStyleFormValues } from "../../schemas/packing-style-schema";

/**
 * The shipper and its pack. The shipper is always the first unit row. The person ticks which unit below it is the pack,
 * and packs per shipper is never typed: it is the unit quantities multiplied down to that unit (20 × 2 = 40).
 * The ticked unit is not stored; on opening a saved style it is found again from its packs per shipper.
 */
export function ShipperPackPreview({ form, baseUnit }: { form: UseFormReturn<PackingStyleFormValues>; baseUnit: string | null }) {
  const units = useWatch({ control: form.control, name: "units" }) ?? [];
  const baseLabel = useWatch({ control: form.control, name: "basePackingUom" })?.label;
  const stored = useWatch({ control: form.control, name: "packPerShipper" });
  const baseQuantity = useWatch({ control: form.control, name: "basePackingQuantity" });
  const missing = form.formState.errors.packPerShipper;
  // Found once from the saved packs per shipper; from then on it is the person's tick.
  const [ticked, setTicked] = useState<number | null>(() => matchingPackLevel(form.getValues("units") ?? [], form.getValues("packPerShipper")));
  const [savedCount] = useState(() => form.getValues("packPerShipper"));

  const levels = Array.from({ length: units.length }, (_, offset) => offset + 1);
  const packLevel = ticked !== null && ticked >= 1 && ticked <= units.length ? ticked : null;
  const perShipper = packLevel !== null ? packsPerShipper(units, 0, packLevel) : null;

  // Packs per shipper follows the tick and the unit quantities; with no complete tick it stays empty, so saving asks for the tick.
  useEffect(() => {
    if (packLevel === null) return;
    const next = perShipper ?? Number.NaN;
    if (Object.is(next, form.getValues("packPerShipper"))) return;
    form.setValue("packPerShipper", next, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  }, [form, packLevel, perShipper]);

  const nameAt = (level: number) => (level === units.length ? unitName(baseLabel) : unitName(units[level]?.uom?.label));
  const levelName = (level: number) => nameAt(level) ?? (level === units.length ? "Base packing unit" : `Unit ${level + 1}`);
  const steps = (level: number) => units.slice(0, level).map((unit) => (Number.isFinite(unit.quantity) ? formatCount(unit.quantity) : "?"));
  const shipperName = unitName(units[0]?.uom?.label) ?? "shipper";
  const baseName = unitName(baseLabel) ?? "base packing unit";
  const perPack = packLevel !== null ? baseUnitsPerPack(units, packLevel) : null;
  const packName = packLevel !== null ? levelName(packLevel) : "pack";
  const productPerPack = perPack !== null && typeof baseQuantity === "number" && Number.isFinite(baseQuantity) ? perPack * baseQuantity : null;
  const savedMismatch = packLevel === null && typeof savedCount === "number" && Number.isFinite(savedCount) && savedCount > 0;

  return <section aria-label="Shipper and pack" className="space-y-3 rounded-lg border border-dashed p-3">
    <div className="space-y-1">
      <h3 className="text-sm font-medium">Shipper and pack</h3>
      <p className="text-sm leading-normal text-muted-foreground">
        The shipper is the first unit ({shipperName}). Tick the unit that is the pack; packs per shipper is the quantities multiplied down to it. Anything short of a full shipper is loose packs.
      </p>
    </div>
    <RadioGroup aria-label="Which unit is the pack" value={packLevel === null ? "" : String(packLevel)} onValueChange={(value) => setTicked(Number(value))} className="gap-2">
      {levels.map((level) => {
        const count = packsPerShipper(units, 0, level);
        const id = `pack-level-${level}`;
        return <div key={level} className="flex items-center gap-2 text-sm">
          <RadioGroupItem id={id} value={String(level)} />
          <Label htmlFor={id} className="font-normal">
            {levelName(level)}{level === units.length ? " (base unit)" : ""}
            <span className="text-muted-foreground"> · {steps(level).join(" × ")}{count !== null && level > 1 ? ` = ${formatCount(count)}` : ""} per shipper</span>
          </Label>
        </div>;
      })}
    </RadioGroup>
    {savedMismatch ? <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
      This style was saved with {formatCount(savedCount)} packs per shipper, which no unit gives. Tick the unit that is the pack.</p> : null}
    {missing && packLevel === null ? <p role="alert" className="text-sm text-destructive">Tick the unit that is the pack.</p> : null}
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div><dt className="text-muted-foreground">Pack is</dt><dd data-testid="pack-is" className="font-medium">{packLevel !== null ? packName : "Not ticked"}</dd></div>
      <div><dt className="text-muted-foreground">Packs per shipper</dt><dd data-testid="packs-per-shipper" className="font-medium tabular-nums">
        {packLevel === null ? "–" : perShipper === null ? "Fill in every quantity" : `${packLevel > 1 ? `${steps(packLevel).join(" × ")} = ` : ""}${formatCount(perShipper)}`}</dd></div>
    </dl>
    {perShipper !== null && perPack !== null ? <ul data-testid="shipper-pack-result" className="space-y-1 text-sm leading-normal">
      <li>1 shipper ({shipperName}) = <strong>{formatCount(perShipper)} {perShipper === 1 ? "pack" : "packs"}</strong> ({perShipper === 1 ? packName : pluralUnit(packName)})</li>
      <li>1 pack ({packName}) = {formatCount(perPack)} {perPack === 1 ? baseName : pluralUnit(baseName)}{productPerPack !== null ? ` = ${formatCount(productPerPack)}${baseUnit ? ` ${baseUnit}` : ""} of product` : ""}</li>
    </ul> : null}
  </section>;
}
