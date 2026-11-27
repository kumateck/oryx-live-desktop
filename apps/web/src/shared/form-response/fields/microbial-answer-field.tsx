import { useEffect, useState } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomFieldProps } from "@/shared/forms/form-wizard-types";
import { averageCount, describe, quantityUnits, readColonyCount, readDilution, readIncubation } from "@/shared/microbial/microbial-values";
import { QuestionType } from "@/shared/questions/question-types";
import { useAnswerField } from "../answer-context";

// Dilution, incubation and colony-count answers, entered as their parts and stored as the JSON the server checks.
// A CFU calculation is shown read-only: the server works it out when the count and dilution are saved.

const toNumber = (text: string) => text.trim() === "" || !Number.isFinite(Number(text)) ? null : Number(text);
const shown = (value: number | null | undefined) => value === null || value === undefined ? "" : String(value);
const localDateTime = (iso: string | null | undefined) => { if (!iso) return ""; const date = new Date(iso); if (Number.isNaN(date.getTime())) return ""; const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; };
const isoFromLocal = (text: string) => { if (!text) return null; const date = new Date(text); return Number.isNaN(date.getTime()) ? null : date.toISOString(); };

function Part({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="min-w-0 space-y-1"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

export default function MicrobialAnswerField({ name, control, disabled }: CustomFieldProps<FieldValues>) {
  const field = useAnswerField(name);
  const { field: input } = useController({ name, control });
  const raw = typeof input.value === "string" ? input.value : null;
  const set = (value: Record<string, unknown> | null) => input.onChange(value ? JSON.stringify(value) : null);
  if (!field) return null;
  switch (field.question.type) {
    case QuestionType.Dilution: return <DilutionInput id={name} raw={raw} disabled={disabled} onChange={set} />;
    case QuestionType.Incubation: return <IncubationInput id={name} raw={raw} disabled={disabled} onChange={set} />;
    case QuestionType.ColonyCount: return <ColonyCountInput id={name} raw={raw} disabled={disabled} onChange={set} />;
    case QuestionType.CfuCalculation: return <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm" aria-live="polite">
      {describe(QuestionType.CfuCalculation, raw) ?? <span className="text-muted-foreground">Calculated when the colony count and dilution are saved.</span>}</p>;
    default: return null;
  }
}

function DilutionInput({ id, raw, disabled, onChange }: { id: string; raw: string | null; disabled: boolean | undefined; onChange: (value: Record<string, unknown> | null) => void }) {
  const saved = readDilution(raw);
  const [parts, setParts] = useState({ sample: shown(saved?.sample), sampleUnit: saved?.sampleUnit ?? "g", diluent: shown(saved?.diluent), factor: shown(saved?.factor) });
  const update = (next: Partial<typeof parts>) => {
    const merged = { ...parts, ...next };
    // The factor follows from sample and diluent ((sample + diluent) / sample) unless the analyst types it.
    const sample = toNumber(merged.sample); const diluent = toNumber(merged.diluent);
    if (!("factor" in next) && sample && diluent !== null) merged.factor = String(Number(((sample + diluent) / sample).toFixed(4)));
    setParts(merged);
    const factor = toNumber(merged.factor);
    onChange(factor && factor > 0 ? { sample, sampleUnit: merged.sampleUnit, diluent, factor } : null);
  };
  return <fieldset disabled={disabled} className="grid min-w-0 gap-2 sm:grid-cols-4">
    <Part id={`${id}-sample`} label="Sample"><Input id={`${id}-sample`} inputMode="decimal" value={parts.sample} onChange={(event) => update({ sample: event.target.value })} /></Part>
    <Part id={`${id}-unit`} label="Unit"><select id={`${id}-unit`} className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={parts.sampleUnit} onChange={(event) => update({ sampleUnit: event.target.value })}>
      {quantityUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></Part>
    <Part id={`${id}-diluent`} label="Diluent (mL)"><Input id={`${id}-diluent`} inputMode="decimal" value={parts.diluent} onChange={(event) => update({ diluent: event.target.value })} /></Part>
    <Part id={`${id}-factor`} label="Dilution factor"><Input id={`${id}-factor`} inputMode="decimal" value={parts.factor} onChange={(event) => update({ factor: event.target.value })} aria-describedby={`${id}-factor-hint`} /></Part>
    <p id={`${id}-factor-hint`} className="text-xs text-muted-foreground sm:col-span-4">For 10 g in 90 mL the factor is 10 (1 in 10).</p>
  </fieldset>;
}

function IncubationInput({ id, raw, disabled, onChange }: { id: string; raw: string | null; disabled: boolean | undefined; onChange: (value: Record<string, unknown> | null) => void }) {
  const saved = readIncubation(raw);
  const [parts, setParts] = useState({ temperature: shown(saved?.temperature), hours: shown(saved?.hours), startedAt: localDateTime(saved?.startedAt), endedAt: localDateTime(saved?.endedAt) });
  const update = (next: Partial<typeof parts>) => {
    const merged = { ...parts, ...next };
    setParts(merged);
    const temperature = toNumber(merged.temperature); const hours = toNumber(merged.hours); const startedAt = isoFromLocal(merged.startedAt);
    onChange(temperature !== null && hours && hours > 0 && startedAt ? { temperature, hours, startedAt, endedAt: isoFromLocal(merged.endedAt) } : null);
  };
  const early = parts.endedAt && parts.startedAt && parts.endedAt < parts.startedAt;
  return <fieldset disabled={disabled} className="grid min-w-0 gap-2 sm:grid-cols-4">
    <Part id={`${id}-temperature`} label="Temperature (°C)"><Input id={`${id}-temperature`} inputMode="decimal" value={parts.temperature} onChange={(event) => update({ temperature: event.target.value })} /></Part>
    <Part id={`${id}-hours`} label="Period (hours)"><Input id={`${id}-hours`} inputMode="decimal" value={parts.hours} onChange={(event) => update({ hours: event.target.value })} /></Part>
    <Part id={`${id}-start`} label="Started"><Input id={`${id}-start`} type="datetime-local" value={parts.startedAt} onChange={(event) => update({ startedAt: event.target.value })} /></Part>
    <Part id={`${id}-end`} label="Ended"><Input id={`${id}-end`} type="datetime-local" value={parts.endedAt} aria-invalid={early ? true : undefined} onChange={(event) => update({ endedAt: event.target.value })} /></Part>
    {early ? <p role="alert" className="text-xs text-destructive sm:col-span-4">The end cannot be before the start.</p>
      : <p className="text-xs text-muted-foreground sm:col-span-4">Save the start now; record the end when the plates come out.</p>}
  </fieldset>;
}

function ColonyCountInput({ id, raw, disabled, onChange }: { id: string; raw: string | null; disabled: boolean | undefined; onChange: (value: Record<string, unknown> | null) => void }) {
  const saved = readColonyCount(raw);
  const [plates, setPlates] = useState<string[]>(() => saved?.plates.length ? saved.plates.map(String) : ["", ""]);
  const [tntc, setTntc] = useState(saved?.tooNumerousToCount ?? false);
  useEffect(() => {
    const counts = plates.map((plate) => toNumber(plate));
    const valid = counts.every((count) => count === null || (Number.isInteger(count) && count >= 0));
    const entered = counts.filter((count): count is number => count !== null);
    onChange(tntc ? { plates: [], tooNumerousToCount: true } : valid && entered.length > 0 ? { plates: entered, tooNumerousToCount: false } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report the entered counts whenever they change
  }, [plates, tntc]);
  const counts = plates.map((plate) => toNumber(plate)).filter((count): count is number => count !== null);
  const average = averageCount({ plates: counts, tooNumerousToCount: tntc });
  return <fieldset disabled={disabled} className="min-w-0 space-y-2">
    <div className="grid gap-2 sm:grid-cols-4">{plates.map((plate, index) => <Part key={index} id={`${id}-plate-${String(index)}`} label={`Plate ${String(index + 1)} (cfu)`}>
      <Input id={`${id}-plate-${String(index)}`} inputMode="numeric" disabled={tntc} value={plate} onChange={(event) => setPlates((current) => current.map((item, at) => at === index ? event.target.value : item))} /></Part>)}</div>
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button type="button" className="text-xs underline underline-offset-2" disabled={tntc || plates.length >= 4} onClick={() => setPlates((current) => [...current, ""])}>Add plate</button>
      <span className="flex items-center gap-2"><Checkbox id={`${id}-tntc`} checked={tntc} onCheckedChange={(checked) => setTntc(checked === true)} /><Label htmlFor={`${id}-tntc`}>Too numerous to count</Label></span>
      {average !== null ? <span className="text-xs text-muted-foreground">Average {Number(average.toFixed(2))} cfu</span> : null}
    </div>
  </fieldset>;
}
