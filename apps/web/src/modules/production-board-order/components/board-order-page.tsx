import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DraggableDataTable, dataTableColumns } from "@/shared/datatable";
import { PageHeader } from "@/shared/navigation/page-header";
import { UnsavedChangesGuard } from "@/shared/navigation/unsaved-changes";
import { useAccess } from "@/shared/auth/use-access";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useBoardOrderQuery, useSaveBoardOrderMutation, useDepartmentsQuery } from "../api/board-order-api";
import { boardOrderPermissions, boardOrderSchema, departmentsSchema, tabletOrder, type BoardOperation } from "../lib/board-order";

const column = dataTableColumns<BoardOperation>();
const columns = column.columns([
  column.display({ id: "position", header: "Board order", size: 110, cell: ({ row }) => row.index + 1 }),
  column.accessor("name", { header: "Operation", cell: ({ getValue }) => <div className="break-words">{getValue()}</div> }),
]);
const audit = { module: "Settings", subModule: "Procedures" };

function OrderEditor({ departmentId, onDirty }: { departmentId: string; onDirty: (dirty: boolean) => void }) {
  const query = useBoardOrderQuery({ ...audit, departmentId }, { refetchOnMountOrArgChange: true });
  const [save, saving] = useSaveBoardOrderMutation();
  const permission = usePermissionAction(boardOrderPermissions.edit);
  const { has } = useAccess();
  const [draft, setDraft] = useState<{ version: string; rows: BoardOperation[] } | null>(null);
  const [message, setMessage] = useState("");
  const parsed = useMemo(() => boardOrderSchema.safeParse(query.currentData), [query.currentData]);
  const data = parsed.success && parsed.data.departmentId === departmentId ? parsed.data : null;
  const rows = draft?.rows ?? data?.operations ?? [];
  const changed = Boolean(data && (rows.length !== data.operations.length || rows.some((row, index) => row.id !== data.operations[index]?.id)));
  useEffect(() => onDirty(changed), [changed, onDirty]);
  const allowed = has(boardOrderPermissions.edit);
  const error = query.error ? apiErrorMessage(query.error) : query.currentData && !data ? "The department order could not be read. Reload it before editing." : null;
  const reorder = (next: BoardOperation[]) => { if (data && allowed) setDraft({ version: draft?.version ?? data.version, rows: next }); };
  const reload = () => { setDraft(null); setMessage(""); void query.refetch(); };
  const submit = async () => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (!data || !changed) return;
    setMessage("");
    const result = await save({ ...audit, departmentId, domainEntitiesBaseSaveProductionBoardOrder: {
      version: draft?.version ?? data.version, operationIds: rows.map(row => row.id),
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null); toast.success("Department board order saved"); void query.refetch();
  };
  return <section className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Drag the handles to arrange columns. From the keyboard, use Space to lift, arrow keys to move, then Space to drop.</p>
      <div className="flex flex-wrap gap-2">
        {allowed && data?.departmentName.toLowerCase().includes("tablet") ? <Button variant="outline" disabled={saving.isLoading || query.isFetching} onClick={() => reorder(tabletOrder(rows))}>Use Tablet sequence</Button> : null}
        <Button variant="outline" disabled={saving.isLoading} onClick={reload}>Reload saved order</Button>
        {allowed ? <Button disabled={!changed || saving.isLoading || query.isFetching || Boolean(error)} onClick={() => void submit()}>{saving.isLoading ? "Saving…" : "Save order"}</Button> : null}
      </div>
    </div>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {changed ? <p role="status" className="text-sm">Order changed. Save to apply it to this department's production board.</p> : null}
    <DraggableDataTable label="Department production board order" columns={columns} rows={rows} getRowId={row => row.id}
      describeRow={row => row.name} onReorder={reorder} disabled={!allowed || saving.isLoading || Boolean(error)}
      loading={query.isLoading} error={error} onRetry={reload} fill={false} emptyTitle="No operations linked to this department"
      emptyDescription="Link operations to this production department from Operations, then reload this order." />
  </section>;
}

export function BoardOrderPage() {
  const [params, setParams] = useSearchParams();
  const user = useCurrentUser();
  const { has } = useAccess();
  const [dirty, setDirty] = useState(false);
  const mayView = has(boardOrderPermissions.view);
  const query = useDepartmentsQuery(mayView ? { ...audit, type: 0, page: 1, pageSize: 500 } : skipToken);
  const parsed = useMemo(() => departmentsSchema.safeParse(query.currentData), [query.currentData]);
  const departments = parsed.success ? parsed.data.data : [];
  const selected = params.get("departmentId") ?? (departments.some(row => row.id === user?.departmentId) ? user?.departmentId : null) ?? departments[0]?.id ?? "";
  if (!mayView) return <p role="alert">You do not have permission to view department board orders.</p>;
  return <article className="min-w-0 space-y-4">
    <UnsavedChangesGuard when={dirty} />
    <PageHeader title="Production board order" crumbs={[]} />
    <p className="text-sm text-muted-foreground">Arrange the department's board columns. Each batch keeps its recorded production procedure and step order.</p>
    <div className="max-w-md space-y-1.5"><Label htmlFor="board-department">Production department</Label>
      <Select value={selected} disabled={dirty} onValueChange={value => setParams({ departmentId: value })}>
        <SelectTrigger id="board-department"><SelectValue placeholder={query.isLoading ? "Loading departments…" : "Choose a department"} /></SelectTrigger>
        <SelectContent>{departments.map(row => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent>
      </Select>
      {dirty ? <p className="text-sm text-muted-foreground">Save or reload the order before choosing another department.</p> : null}
    </div>
    {query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)}</p> : null}
    {query.currentData && !parsed.success ? <p role="alert" className="text-sm text-destructive">The department list could not be read. Reload the page to try again.</p> : null}
    {selected ? <OrderEditor key={selected} departmentId={selected} onDirty={setDirty} /> : null}
  </article>;
}
