import { Button } from "@/components/ui/button";
import { ActivitiesBoard } from "@/modules/activities/components/board/activities-board";
import { useActivityBoard } from "@/modules/activities/hooks/use-activity-board";
import { Skeleton } from "@/shared/skeleton/skeleton";

export default function ActivitiesPage() {
  const board = useActivityBoard();
  const batches = board.columns.reduce((total, column) => total + column.cards.length, 0);
  return <section className="page-fill">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Production board</h1></div>
      {board.error || board.loading ? null : <p className="text-sm text-muted-foreground">{board.department ? `${board.department} · ` : ""}{batches} {batches === 1 ? "batch" : "batches"} in production</p>}
    </div>
    {board.loading ? <div role="status" aria-label="Loading production board" className="flex min-h-0 flex-1 gap-3 overflow-hidden">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-full w-72 shrink-0" />)}</div>
      : board.error ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">{board.error}<Button type="button" size="sm" variant="outline" onClick={board.retry}>Retry</Button></div>
        : board.columns.length === 0 ? <p className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No batches are in production. A batch appears here when its production is started from a schedule.</p>
          : <ActivitiesBoard columns={board.columns} />}
  </section>;
}
