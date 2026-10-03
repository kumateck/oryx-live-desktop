import { useEffect, useMemo, useState } from "react";
import { Columns3, List, Plus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1TicketsByIdQuery, useGetApiV1TicketsQuery } from "../api/ticket-api";
import { useTicketMoves } from "../hooks/use-ticket-moves";
import { audit, categoryLabels, moveLabels, optionsOf, priorityLabels, statusLabels, ticketPath, ticketPermissions, ticketRoots, type TicketMove, type TicketScope } from "../lib/tickets";
import { ticketRowsSchema, ticketSchema, type Ticket } from "../schemas/ticket-schema";
import { TicketActivityFeed } from "./ticket-activity";
import { DueDate, PriorityBadge, StatusBadge } from "./ticket-badges";
import { TicketBoard } from "./ticket-board";
import { ReportIssueDialog, TicketMoveDialog } from "./ticket-dialogs";

interface Filters { status: SelectOption | null; priority: SelectOption | null; category: SelectOption | null }
const filterFields: WizardField<Filters>[] = [
  { type: InputTypes.SELECT, name: "status", label: "Status", mode: "single", source: "sync", options: optionsOf(statusLabels), placeholder: "All statuses" },
  { type: InputTypes.SELECT, name: "priority", label: "Priority", mode: "single", source: "sync", options: optionsOf(priorityLabels), placeholder: "All priorities" },
  { type: InputTypes.SELECT, name: "category", label: "Category", mode: "single", source: "sync", options: optionsOf(categoryLabels), placeholder: "All categories" },
];
const column = dataTableColumns<Ticket>();
function columnsFor(scope: TicketScope) {
  return column.columns([
    column.accessor("number", { header: "Ticket", size: 150, cell: ({ row }) => <span className="font-medium">{row.original.number}</span> }),
    column.accessor("title", { header: scope === "mine" ? "Issue" : "Title", cell: ({ row }) => <span className="break-words">{row.original.title}</span> }),
    column.accessor("category", { header: "Category", size: 160, cell: ({ row }) => categoryLabels[row.original.category] }),
    column.accessor("priority", { header: "Priority", size: 120, cell: ({ row }) => <PriorityBadge priority={row.original.priority} /> }),
    column.accessor("status", { header: "Status", size: 130, cell: ({ row }) => <StatusBadge status={row.original.status} /> }),
    column.accessor((row) => row.assignee?.name ?? "", { id: "assignee", header: "Assigned to", size: 190, cell: ({ row }) => row.original.assignee?.name ?? <span className="text-muted-foreground">{scope === "mine" ? "Awaiting assignment" : "Unassigned"}</span> }),
    ...(scope === "team" ? [column.accessor((row) => row.reporter?.name ?? "", { id: "reporter", header: "Reported by", size: 190, cell: ({ row }) => row.original.reporter?.name ?? "–" })] : []),
    column.accessor((row) => row.dueDate ?? "", { id: "due", header: "Due", size: 170, cell: ({ row }) => <DueDate dueDate={row.original.dueDate} status={row.original.status} /> }),
  ]);
}
const chosen = (option: SelectOption | null) => option ? Number(option.value) : undefined;

/** My IT Issues (what the signed-in user reported) or the IT team's tickets, as a list or, for the team, a board. */
export function TicketListPage({ scope }: { scope: TicketScope }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { has } = useAccess();
  const [view, setView] = useState<"board" | "list">(scope === "team" ? "board" : "list");
  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(scope === "mine" ? "your issues" : "tickets", busy);
  const form = useForm<Filters>({ defaultValues: { status: null, priority: null, category: null } });
  const filters = useWatch({ control: form.control });
  const status = chosen(filters.status as SelectOption | null);
  const priority = chosen(filters.priority as SelectOption | null);
  const category = chosen(filters.category as SelectOption | null);
  const filtered = status !== undefined || priority !== undefined || category !== undefined;
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${status}|${priority}|${category}|${view}` });
  const board = view === "board";
  const query = useGetApiV1TicketsQuery({ ...audit, page: board ? 1 : table.page, pageSize: board ? 500 : table.pageSize, ...(search.trim() ? { searchQuery: search } : {}),
    ...(status !== undefined ? { status: status as 0 | 1 | 2 | 3 | 4 } : {}), ...(priority !== undefined ? { priority: priority as 0 | 1 | 2 | 3 } : {}), ...(category !== undefined ? { category: category as 0 | 1 | 2 | 3 | 4 } : {}),
    // My issues are only ever the signed-in user's own.
    ...(scope === "mine" ? { reportedById: user?.id ?? "" } : {}) }, { skip: scope === "mine" && !user?.id });
  const parsed = useMemo(() => query.data ? ticketRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const columns = useMemo(() => columnsFor(scope), [scope]);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned tickets the app could not read." : null;
  const total = query.data?.totalRecordCount ?? rows.length;
  return <section className="page-fill">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">IT TICKETS</p><h1 className="text-xl font-semibold">{scope === "mine" ? "My IT issues" : "IT team tickets"}</h1>
        <p className="text-sm text-muted-foreground">{scope === "mine" ? "Report an IT problem and follow it to its resolution." : "Every reported issue, to assign, work on and close."}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {scope === "team" ? <div role="group" aria-label="View" className="flex gap-1">
          <Button type="button" size="sm" variant={board ? "default" : "outline"} aria-pressed={board} onClick={() => setView("board")}><Columns3 />Board</Button>
          <Button type="button" size="sm" variant={!board ? "default" : "outline"} aria-pressed={!board} onClick={() => setView("list")}><List />List</Button></div> : null}
        {has(ticketPermissions.create) ? <Button type="button" size="sm" onClick={() => setReporting(true)}><Plus />Report issue</Button> : null}
      </div>
    </div>
    <div className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><FormWizard form={form} fields={filterFields} className="md:grid-cols-3" /></div>
      {filtered ? <Button type="button" size="sm" variant="outline" onClick={() => form.reset({ status: null, priority: null, category: null })}>Clear filters</Button> : null}</div>
    {board ? (query.isLoading ? <div role="status" aria-label="Loading the board" className="h-64 animate-pulse rounded-lg bg-muted" />
      : error ? <div role="alert" className="space-y-2 text-sm"><p>{error}</p><Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : <>{total > rows.length ? <p role="status" className="text-sm text-amber-700 dark:text-amber-400">The board shows the first {rows.length} of {total} tickets. Narrow it with the filters, or use the list.</p> : null}<TicketBoard tickets={rows} /></>)
      : <ServerDataTable label={scope === "mine" ? "My IT issues" : "IT team tickets"} columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={error} onRowOpen={(row) => void navigate(ticketPath(scope, row.id))}
        emptyTitle={filtered || search.trim() ? "No tickets match" : scope === "mine" ? "You have not reported an issue" : "No tickets"} emptyDescription={filtered || search.trim() ? "Try other filters or another search." : scope === "mine" ? "Use Report issue when something is not working." : "Tickets appear here when someone reports an issue."} />}
    {reporting ? <ReportIssueDialog scope={scope} onClose={() => setReporting(false)} /> : null}
  </section>;
}

function Detail({ scope, ticket }: { scope: TicketScope; ticket: Ticket }) {
  const { moves } = useTicketMoves();
  const [move, setMove] = useState<TicketMove | null>(null);
  const available = moves(ticket);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={ticket.title} crumbs={[{ label: scope === "mine" ? "My IT issues" : "IT team tickets", to: ticketRoots[scope] }, { label: ticket.number }]}
      actions={available.map((item) => <Button key={item} type="button" size="sm" variant={item === "assign" || item === "reopen" ? "outline" : "default"} onClick={() => setMove(item)}>{item === "assign" && ticket.assignee ? "Reassign" : moveLabels[item]}</Button>)} />
    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-muted-foreground">{ticket.number}</span><PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} /></div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-lg border bg-card p-4"><h2 className="mb-2 text-sm font-semibold">Description</h2><p className="whitespace-pre-wrap break-words text-sm">{ticket.description ?? "No description given."}</p></section>
        <TicketActivityFeed ticketId={ticket.id} />
      </div>
      <DetailGroup title="Details">
        <DetailItem label="Category" value={categoryLabels[ticket.category]} />
        <DetailItem label="Reported by" value={ticket.reporter?.name} />
        <DetailItem label="Department" value={ticket.department} />
        <DetailItem label="Reported" value={formatDateTime(ticket.createdAt)} />
        <DetailItem label="Assigned to" value={ticket.assignee?.name ?? "Unassigned"} />
        <DetailItem label="Due" value={ticket.dueDate ? <DueDate dueDate={ticket.dueDate} status={ticket.status} /> : null} />
        <DetailItem label="Done" value={formatDateTime(ticket.doneAt)} />
        <DetailItem label="Closed" value={formatDateTime(ticket.closedAt)} />
        {ticket.reopened > 0 ? <DetailItem label="Reopened" value={`${ticket.reopened} ${ticket.reopened === 1 ? "time" : "times"}`} /> : null}
      </DetailGroup>
    </div>
    {move ? <TicketMoveDialog key={move} move={move} ticket={ticket} onClose={() => setMove(null)} /> : null}
  </article>;
}

/** One ticket, from the reporter's list or the team's. */
export function TicketDetailPage({ scope }: { scope: TicketScope }) {
  const { id } = useParams();
  const query = useGetApiV1TicketsByIdQuery({ ...audit, id: id ?? "" }, { skip: !id });
  const ticket = useMemo(() => { const parsed = ticketSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading ticket" groups={3} />;
  if (!ticket) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Ticket unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a ticket the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={ticketRoots[scope]}>{scope === "mine" ? "My IT issues" : "IT team tickets"}</Link></Button></div></div>;
  return <Detail scope={scope} ticket={ticket} />;
}
