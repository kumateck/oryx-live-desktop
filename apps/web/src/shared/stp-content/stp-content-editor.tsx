import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/shared/date-pickers/date-picker";
import { blankTest, moveItem, type DraftContent } from "./stp-draft";
import { sectionKinds, sectionLabel } from "./stp-content";
import { StpTestEditor } from "./stp-test-editor";

/** "2026-11-27" as that local calendar day, and back; an empty or unreadable text is no date. */
export function dayToDate(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}
export const dateToDay = (date: Date) => `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

/** The structured editor: running header, sections 1.0 to 4.0, reagents and notes, and the 5.N tests. */
export function StpContentEditor({ value, onChange, stpNumber, fixedSupersedes }: {
  value: DraftContent; onChange: (value: DraftContent) => void; stpNumber: string; fixedSupersedes: boolean;
}) {
  const set = <K extends keyof DraftContent>(key: K, next: DraftContent[K]) => onChange({ ...value, [key]: next });
  // Header dates are calendar days kept as "yyyy-mm-dd", chosen with the app's date picker.
  const date = (key: "effectiveDate" | "reviewDate" | "issueDate", label: string) =>
    <Field id={`stp-${key}`} label={label}><DatePicker id={`stp-${key}`} label={label} value={dayToDate(value[key])} onChange={(next) => set(key, next ? dateToDay(next) : "")} /></Field>;
  const text = (key: "title" | "area" | "reference" | "revisionNumber" | "supersedesRevision", label: string, type = "text") =>
    <Field id={`stp-${key}`} label={label}><Input id={`stp-${key}`} type={type} value={value[key]} disabled={key === "supersedesRevision" && fixedSupersedes}
      inputMode={key === "revisionNumber" || key === "supersedesRevision" ? "numeric" : undefined} onChange={(event) => set(key, event.target.value)} /></Field>;
  return <div className="space-y-4">
    <section aria-label="Running header" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field id="stp-number" label="STP No."><Input id="stp-number" value={stpNumber} disabled /></Field>
      <div className="sm:col-span-1 lg:col-span-3">{text("title", "Title")}</div>
      {text("revisionNumber", "Revision No.")}{text("supersedesRevision", "Supersedes")}{text("area", "Area")}{text("reference", "Reference")}
      {date("effectiveDate", "Effective date")}{date("reviewDate", "Review date")}{date("issueDate", "Issue date")}
      <div className="sm:col-span-2 lg:col-span-4"><Field id="stp-reason" label="Reason for change">
        <Textarea id="stp-reason" rows={2} value={value.reasonForChange} maxLength={2000} onChange={(event) => set("reasonForChange", event.target.value)} /></Field></div>
    </section>
    <section aria-label="Sections" className="grid gap-3 rounded-lg border bg-card p-4 lg:grid-cols-2">
      {sectionKinds.map((kind) => <Field key={kind} id={`stp-section-${String(kind)}`} label={sectionLabel[kind]}>
        <Textarea id={`stp-section-${String(kind)}`} rows={kind === 4 ? 5 : 3} value={value.sections[kind]}
          placeholder={kind === 4 ? "One reagent per line" : kind === 5 ? "Buffer preparation, references to SOPs before 5.1" : undefined}
          onChange={(event) => set("sections", { ...value.sections, [kind]: event.target.value })} /></Field>)}
    </section>
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">5.0 Procedure</h2>
      <Button type="button" size="sm" variant="outline" onClick={() => set("tests", [...value.tests, blankTest()])}><Plus />Add test</Button></div>
    {value.tests.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No tests yet.</p> : null}
    {value.tests.map((test, index) => <StpTestEditor key={test.key} test={test} index={index} count={value.tests.length}
      onChange={(next) => set("tests", value.tests.map((item) => item.key === test.key ? next : item))}
      onMove={(offset) => set("tests", moveItem(value.tests, index, offset))}
      onRemove={() => set("tests", value.tests.filter((item) => item.key !== test.key))} />)}
  </div>;
}
