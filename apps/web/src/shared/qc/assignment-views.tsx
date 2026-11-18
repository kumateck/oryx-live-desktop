import { ClipboardList, UserRound } from "lucide-react";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { FormAssignees } from "./assignments";
import { RichTextView } from "@/shared/rich-text/rich-text-view";

function AnalystList({ assignees }: { assignees: FormAssignees | null }) {
  if (!assignees || assignees.analysts.length === 0) return <div className="flex flex-col items-center rounded-lg border border-dashed bg-muted/20 px-5 py-8 text-center">
    <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground"><ClipboardList className="size-5" /></span>
    <p className="font-medium">No analysts assigned</p><p className="mt-1 text-sm text-muted-foreground">There are no test fields assigned to analysts yet.</p></div>;
  const fieldCount = assignees.analysts.reduce((total, analyst) => total + analyst.sections.reduce((count, section) => count + section.questions.length, 0), 0);
  return <div className="space-y-3">
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground"><UserRound className="size-4" /></span>
      <div><p className="text-sm font-medium">Assigned analysts</p><p className="text-xs text-muted-foreground">People responsible for test fields</p></div></div>
      <div className="flex gap-2 text-xs"><span className="rounded-full border bg-background px-2.5 py-1">{assignees.analysts.length} {assignees.analysts.length === 1 ? "analyst" : "analysts"}</span><span className="rounded-full border bg-background px-2.5 py-1">{fieldCount} {fieldCount === 1 ? "field" : "fields"}</span></div></div>
    <div className="space-y-3">{assignees.analysts.map((analyst) => <section key={analyst.assigneeId} aria-label={`Assignments for ${analyst.name}`} className="overflow-hidden rounded-lg border bg-background">
      <header className="flex min-w-0 items-center gap-3 border-b bg-muted/20 px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">{analyst.name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}</span>
        <div className="min-w-0 flex-1"><h3 className="break-words font-medium">{analyst.name}</h3><p className="text-xs text-muted-foreground">Assigned analyst</p></div>
        <span className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">{analyst.sections.reduce((count, section) => count + section.questions.length, 0)} {analyst.sections.reduce((count, section) => count + section.questions.length, 0) === 1 ? "question" : "questions"}</span>
      </header>
      <div className="space-y-3 px-4 py-3">{analyst.sections.map((section) => <section key={`${analyst.assigneeId}-${section.name}`} aria-label={`${section.name} questions`} className="min-w-0">
        <div className="mb-1.5 flex items-start justify-between gap-2"><h4 className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-muted-foreground"><RichTextView html={section.name} /></h4>
          <span className="shrink-0 text-xs text-muted-foreground">{section.questions.length}</span></div>
        <ul className="space-y-1 border-l pl-3">{section.questions.map((question, index) => <li key={`${section.name}-${index}`} className="break-words py-1 text-sm">{question}</li>)}</ul>
      </section>)}</div>
    </section>)}</div>
  </div>;
}

/** Who holds which fields of a batch's test. */
export function AssignmentsDialog({ assignees, loading, error, onClose }: { assignees: FormAssignees | null; loading: boolean; error: string | null; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader className="gap-1"><DialogTitle className="text-base">Test assignments</DialogTitle><DialogDescription>See who is responsible for each test field.</DialogDescription></DialogHeader>
    <DialogBody><div className="py-1">{loading ? <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground"><Spinner />Loading assignments…</div> : error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : <AnalystList assignees={assignees} />}</div></DialogBody>
  </DialogContent></Dialog>;
}

export { ReassignPanel } from "./reassign-fields-panel";
