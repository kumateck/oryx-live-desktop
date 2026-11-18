import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { formatDateTime } from "@/shared/format/dates";
import type { TestCorrectionKind } from "./test-correction-access";
import { useTestCorrection } from "./use-test-correction";

/** The checking page and the analyst's worksheet share the same permission-gated correction history. */
export function TestCorrectionPanel(props: { responseId: string; kind: TestCorrectionKind; canReturn: boolean; onReturned: () => void }) {
  const state = useTestCorrection(props.responseId, props.kind, props.onReturned);
  const canReturn = props.canReturn && (state.history?.canReturn ?? true);
  return <section aria-label="Test corrections" className="space-y-4 print:hidden">
    {canReturn ? <PermissionGuard require={state.access.return}><Button type="button" variant="outline" disabled={state.busy}
      onClick={() => state.setOpen(true)}>Return to under test</Button></PermissionGuard> : null}
    {state.canViewHistory ? <CorrectionHistory state={state} /> : null}
    {state.open ? <Dialog open onOpenChange={open => { if (!state.busy) state.setOpen(open); }}><DialogContent>
      <DialogHeader><DialogTitle>Return to under test</DialogTitle><DialogDescription>The assigned analyst can correct and resubmit the saved answers. The submitted record and this reason stay in the history.</DialogDescription></DialogHeader>
      <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={state.submit}>
        <DialogBody><div className="space-y-2"><Label htmlFor="test-correction-reason">Reason for correction</Label>
          <Textarea id="test-correction-reason" {...state.form.register("reason")} maxLength={2000} disabled={state.busy} rows={4} autoFocus />
          {state.form.formState.errors.reason ? <p role="alert" className="text-sm text-destructive">{state.form.formState.errors.reason.message}</p> : null}
          {state.problem ? <p role="alert" className="text-sm text-destructive">{state.problem}</p> : null}
        </div></DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={state.busy} onClick={() => state.setOpen(false)}>Cancel</Button>
          <PermissionGuard require={state.access.return}><Button type="submit" disabled={state.busy}>{state.busy ? "Returning…" : "Return to under test"}</Button></PermissionGuard>
        </DialogFooter>
      </form>
    </DialogContent></Dialog> : null}
  </section>;
}

function CorrectionHistory({ state }: { state: ReturnType<typeof useTestCorrection> }) {
  return <div className="space-y-2 border-t pt-4">
      <h2 className="text-sm font-semibold">Correction history</h2>
      {state.loading ? <Skeleton className="h-12 w-full" /> : state.historyError ? <div role="alert" className="space-y-2 text-sm text-destructive">
        <p>{state.historyError}</p><Button type="button" variant="outline" onClick={() => void state.retry()}>Retry history</Button>
      </div> : state.history?.history?.length ? <ol className="divide-y text-sm">{state.history.history.map(item => <li key={item.id} className="space-y-1 py-3">
        <p className="font-medium">Returned by {item.returnedBy ?? "Recorded user"} · {formatDateTime(item.returnedAt) ?? "Date not recorded"}</p>
        <p className="max-w-prose whitespace-pre-wrap break-words">{item.reason}</p>
      </li>)}</ol> : <p className="text-sm text-muted-foreground">This test has no correction returns.</p>}
  </div>;
}
