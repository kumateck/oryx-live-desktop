import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { blankStep, moveItem, type DraftStep, type DraftTest } from "./stp-draft";
import { stepKindLabel, type StepKindValue } from "./stp-content";

const stepKinds: readonly StepKindValue[] = [0, 1, 2];
const kindOf: Record<string, StepKindValue | undefined> = { "0": 0, "1": 1, "2": 2 };

function Move({ label, index, count, onMove, onRemove }: { label: string; index: number; count: number; onMove: (offset: -1 | 1) => void; onRemove: () => void }) {
  return <div className="flex shrink-0 gap-1">
    <Button type="button" size="icon" variant="ghost" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></Button>
    <Button type="button" size="icon" variant="ghost" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown /></Button>
    <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${label}`} onClick={onRemove}><Trash2 /></Button>
  </div>;
}

function StepRow({ step, index, count, prefix, onChange, onMove, onRemove }: {
  step: DraftStep; index: number; count: number; prefix: string;
  onChange: (step: DraftStep) => void; onMove: (offset: -1 | 1) => void; onRemove: () => void;
}) {
  const id = `${prefix}-${step.key}`;
  const label = `${stepKindLabel[step.kind].toLowerCase()} ${String(index + 1)}`;
  return <div className="space-y-2 rounded-md border p-2">
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1"><Label htmlFor={`${id}-kind`} className="text-xs">Kind</Label>
        <Select value={String(step.kind)} onValueChange={(value) => { const kind = kindOf[value]; if (kind !== undefined) onChange({ ...step, kind }); }}>
          <SelectTrigger id={`${id}-kind`} className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{stepKinds.map((kind) => <SelectItem key={kind} value={String(kind)}>{stepKindLabel[kind]}</SelectItem>)}</SelectContent>
        </Select></div>
      {step.kind === 0 ? <div className="space-y-1"><Label htmlFor={`${id}-number`} className="text-xs">No.</Label>
        <Input id={`${id}-number`} className="w-24" value={step.number} placeholder="5.1.1" onChange={(event) => onChange({ ...step, number: event.target.value })} /></div>
        : <div className="min-w-48 flex-1 space-y-1"><Label htmlFor={`${id}-heading`} className="text-xs">Heading</Label>
          <Input id={`${id}-heading`} value={step.heading} placeholder={step.kind === 1 ? "Chromatographic Conditions" : "Note"} onChange={(event) => onChange({ ...step, heading: event.target.value })} /></div>}
      <div className="space-y-1"><Label htmlFor={`${id}-ref`} className="text-xs">Refers to</Label>
        <Input id={`${id}-ref`} className="w-40" value={step.referenceCode} placeholder="QCD/SOP/003" onChange={(event) => onChange({ ...step, referenceCode: event.target.value })} /></div>
      <div className="ml-auto"><Move label={label} index={index} count={count} onMove={onMove} onRemove={onRemove} /></div>
    </div>
    <Textarea aria-label={`Text of ${label}`} rows={step.kind === 1 ? 3 : 2} value={step.text}
      placeholder={step.kind === 1 ? "One condition per line" : "Instruction"} onChange={(event) => onChange({ ...step, text: event.target.value })} />
  </div>;
}

/** One 5.N test: its number and title, then its steps, conditions blocks and notes in order. */
export function StpTestEditor({ test, index, count, onChange, onMove, onRemove }: {
  test: DraftTest; index: number; count: number; onChange: (test: DraftTest) => void; onMove: (offset: -1 | 1) => void; onRemove: () => void;
}) {
  const id = `stp-test-${test.key}`;
  const setSteps = (steps: DraftStep[]) => onChange({ ...test, steps });
  return <section aria-label={`Test ${String(index + 1)}`} className="space-y-3 rounded-lg border bg-card p-3">
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1"><Label htmlFor={`${id}-number`} className="text-xs">No.</Label>
        <Input id={`${id}-number`} className="w-20" value={test.number} placeholder="5.1" onChange={(event) => onChange({ ...test, number: event.target.value })} /></div>
      <div className="min-w-56 flex-1 space-y-1"><Label htmlFor={`${id}-title`} className="text-xs">Test</Label>
        <Input id={`${id}-title`} value={test.title} placeholder="Assay" onChange={(event) => onChange({ ...test, title: event.target.value })} /></div>
      <p className="pb-2 text-xs text-muted-foreground">{test.testKey ? `Key: ${test.testKey}` : "New test: key assigned on save"}</p>
      <Move label={`test ${test.title || String(index + 1)}`} index={index} count={count} onMove={onMove} onRemove={onRemove} />
    </div>
    <div className="space-y-2">{test.steps.map((step, position) => <StepRow key={step.key} step={step} index={position} count={test.steps.length} prefix={id}
      onChange={(next) => setSteps(test.steps.map((item) => item.key === step.key ? next : item))}
      onMove={(offset) => setSteps(moveItem(test.steps, position, offset))}
      onRemove={() => setSteps(test.steps.filter((item) => item.key !== step.key))} />)}</div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...test.steps, blankStep(0)])}><Plus />Step</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...test.steps, blankStep(1)])}><Plus />Conditions</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setSteps([...test.steps, blankStep(2)])}><Plus />Note</Button>
    </div>
  </section>;
}
