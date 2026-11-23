import { useMemo, useState } from "react";
import { FilePlus2, GitBranchPlus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { usePriceListsQuery } from "../api/price-list-api";
import { divisionLabel, priceListAudit, priceListDetailPath, priceListKeys, priceListSummarySchema,
  priceListTone, type PriceListSummary } from "../lib/price-lists";
import { CostingTabs } from "./costing-tabs";
import { PriceListHeaderDialog } from "./price-list-header-dialog";

const column = dataTableColumns<PriceListSummary>();
const columns = column.columns([
  column.accessor("revisionNumber", { header: "Revision", size: 100, cell: ({ row }) => `Rev. ${row.original.revisionNumber}` }),
  column.accessor((row) => row.supersedesRevision ?? -1, { id: "supersedes", header: "Supersedes", size: 110, cell: ({ row }) => row.original.supersedesRevision ?? "–" }),
  column.accessor("documentNumber", { header: "Document No." }),
  column.accessor("lineCount", { header: "Pack prices", size: 100 }),
  column.accessor((row) => row.preparedBy ?? "", { id: "preparedBy", header: "Prepared by" }),
  column.accessor((row) => row.createdAt ?? "", { id: "prepared", header: "Prepared", cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
  column.accessor("effectiveFrom", { header: "Effective from", cell: ({ row }) => formatDate(row.original.effectiveFrom) ?? "–" }),
  column.accessor("stage", { header: "Status", cell: ({ row }) => <Badge variant={priceListTone(row.original.stage)}>{row.original.stage}</Badge> }),
]);

export function PriceListRevisionsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const division = params.get("division") === "1" ? 1 : 0;
  const search = usePageSearch("price-list revisions");
  const table = useServerTable({ pageSize: 20, resetKey: `${division}|${search}` });
  const query = usePriceListsQuery({ ...priceListAudit, division, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.currentData ? priceListSummarySchema.array().safeParse(query.currentData.data ?? []) : null, [query.currentData]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.currentData, table, rows.length);
  const { has } = useAccess();
  const [preparing, setPreparing] = useState(false);
  const sourceResult = priceListSummarySchema.safeParse(query.currentData?.latestApproved);
  const source = sourceResult.success ? sourceResult.data : null;
  const open = Boolean(query.currentData?.openRevisionId);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Price-list revisions</h1>
        <p className="text-sm text-muted-foreground">Approved product prices per packing style. A revision takes effect only after approval and its effective date.</p></div>
      {!open && query.isSuccess && has(source ? priceListKeys.revise : priceListKeys.create)
        ? <Button size="sm" onClick={() => setPreparing(true)}>{source ? <GitBranchPlus /> : <FilePlus2 />}{source ? "New revision" : "Prepare list"}</Button> : null}
    </header>
    <CostingTabs />
    <div role="group" aria-label="Division" className="flex flex-wrap gap-1">{([0, 1] as const).map((value) =>
      <Button key={value} size="sm" variant={division === value ? "default" : "outline"} aria-pressed={division === value}
        onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("division", String(value)); return next; }, { replace: true })}>{divisionLabel(value)}</Button>)}</div>
    {open ? <p className="text-sm text-muted-foreground">A revision is being prepared. Complete or reject it before preparing another for this division.</p> : null}
    <ServerDataTable label="Price-list revisions" columns={columns} rows={rows} getRowId={(row) => row.id}
      page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(priceListDetailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The price-list revisions could not be read." : null}
      emptyTitle="No price-list revisions yet" emptyDescription="Prepare the first revision for this division. Existing prices remain in use until an approved revision takes effect." />
    {preparing ? <PriceListHeaderDialog division={division} source={source} nextRevisionNumber={query.currentData?.nextRevisionNumber ?? 0} onClose={() => setPreparing(false)} /> : null}
  </section>;
}
