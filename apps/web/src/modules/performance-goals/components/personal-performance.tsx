import { lazy, Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/shared/api/generated/hr";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { performanceApi } from "@/shared/performance/api";
import { goalStatuses, performanceAudit, reviewStatuses, type Goal, type Review } from "@/shared/performance/contracts";
import { GoalActions } from "./goal-actions";

const Editor = lazy(() => import("./goal-editor").then((m) => ({ default: m.GoalEditor })));
export const myReviewPath = (id: string) => `/hr/goals/reviews/${encodeURIComponent(id)}`;
const reviewKeys = { kind: "some" as const, permissions: ["CanSubmitSelfAssessment", "CanSubmitManagerReview"] };
type Self = { id: string; name: string };
const goalColumn = dataTableColumns<Goal>();
const reviewColumn = dataTableColumns<Review>();

function useSelf() {
  const me = hrApi.useGetApiV1EmployeeMeQuery(performanceAudit);
  const self = useMemo<Self | null>(() => me.data?.id ? { id: me.data.id, name: [me.data.firstName, me.data.lastName].filter(Boolean).join(" ") || "You" } : null, [me.data]);
  return { me, self };
}

function MyGoals({ self }: { self: Self }) {
  const { allows } = useAccess();
  const [creating, setCreating] = useState(false);
  const table = useServerTable({ pageSize: 20 });
  const query = performanceApi.usePerformanceGoalsQuery({ employeeId: self.id, page: table.page, pageSize: table.pageSize });
  const rows = (query.currentData?.data ?? []).filter((g) => g.employeeId === self.id);
  const meta = pageMeta(query.currentData, table, rows.length);
  const columns = useMemo(() => goalColumn.columns([
    goalColumn.accessor("title", { header: "Goal" }),
    goalColumn.accessor((r) => r.cycleName ?? r.cycleId, { id: "cycle", header: "Cycle" }),
    goalColumn.accessor((r) => `${r.weight}%`, { id: "weight", header: "Weight", size: 90 }),
    goalColumn.accessor((r) => goalStatuses[r.status], { id: "status", header: "Status", size: 120 }),
    goalColumn.accessor((r) => `${r.progressPercentage}%`, { id: "progress", header: "Progress", size: 100 }),
    goalColumn.accessor((r) => formatDate(r.targetDate), { id: "target", header: "Target", size: 120 }),
    goalColumn.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <GoalActions row={row.original} self={self} /> }),
  ]), [self]);
  return <section aria-label="My goals" className="space-y-2">
    <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">My goals</h2>
      {allows({ kind: "all", permissions: ["CanCreateGoal", "CanViewPerformanceCycles"] }) ? <Button size="sm" onClick={() => setCreating(true)}>Add a goal</Button> : null}</div>
    <ServerDataTable label="My goals" rows={rows} columns={columns} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()} emptyTitle="You have no goals yet" />
    {creating ? <Suspense fallback={<p role="status">Loading goal editor…</p>}><Editor self={self} onClose={() => setCreating(false)} /></Suspense> : null}
  </section>;
}

function MyReviews({ self }: { self: Self }) {
  const navigate = useNavigate();
  const table = useServerTable({ pageSize: 20 });
  const query = performanceApi.useMyPerformanceReviewsQuery({ page: table.page, pageSize: table.pageSize });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  const columns = useMemo(() => reviewColumn.columns([
    reviewColumn.accessor((r) => r.cycleName ?? r.cycleId, { id: "cycle", header: "Cycle" }),
    reviewColumn.accessor((r) => r.employeeName ?? r.employeeId, { id: "employee", header: "Employee" }),
    reviewColumn.accessor((r) => r.employeeId === self.id ? "Your review" : "You review", { id: "part", header: "Your part", size: 130,
      cell: ({ row }) => <Badge variant="outline">{row.original.employeeId === self.id ? "Your review" : "You review"}</Badge> }),
    reviewColumn.accessor((r) => reviewStatuses[r.status], { id: "status", header: "Status", size: 150 }),
  ]), [self]);
  return <section aria-label="My reviews" className="space-y-2"><h2 className="font-semibold">My performance reviews</h2>
    <ServerDataTable label="My performance reviews" rows={rows} columns={columns} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading}
      onRowOpen={(r) => void navigate(myReviewPath(r.id))} error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => void query.refetch()}
      emptyTitle="No reviews involve you yet" />
  </section>;
}

/** The signed-in employee's own goals and the reviews they take part in, through the account's employee link. */
export function PersonalPerformance() {
  const { allows } = useAccess();
  const { me, self } = useSelf();
  if (me.isLoading) return <p role="status" className="text-sm text-muted-foreground">Finding your employee record…</p>;
  if (!self) return <p role="alert" className="text-sm">{me.error ? apiErrorMessage(me.error) : "Your account is not linked to an employee record."} Ask HR to link your account to your employee record.</p>;
  return <div className="space-y-6"><MyGoals self={self} />{allows(reviewKeys) ? <MyReviews self={self} /> : null}</div>;
}
