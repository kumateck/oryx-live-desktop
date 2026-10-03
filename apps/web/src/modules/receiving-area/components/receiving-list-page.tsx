import { useEffect, useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1WarehouseDistributedRequisitionMaterialsQuery } from "../api/receiving-api";
import { audit, canJoinGrn, grnPermissions, readStatus, receivingStatus, receivingTitles, viewPermissions } from "../lib/receiving";
import { deliveredRowsSchema } from "../schemas/receiving-schema";
import { CreateGrnDialog } from "./create-grn-dialog";
import { ReceivingTable } from "./receiving-table";

/** Materials delivered to the user's store at one stage of receiving, raw or packaging. */
export function ReceivingListPage() {
  const { has } = useAccess();
  const [params] = useSearchParams();
  const status = readStatus(params.get("status"));
  const { kind, select, tabs } = useKindTabs(viewPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(receivingTitles[status].toLowerCase(), busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${status}|${kind}` });
  const query = useGetApiV1WarehouseDistributedRequisitionMaterialsQuery({ ...audit, kind: kind ?? 0, status, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? deliveredRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);

  // What is ticked belongs to one stage and one kind; changing either starts again.
  const scope = `${status}|${kind}`;
  const [picked, setPicked] = useState<{ scope: string; ids: Set<string> }>({ scope, ids: new Set() });
  const selected = picked.scope === scope ? picked.ids : new Set<string>();
  const [creating, setCreating] = useState(false);
  const mayCreateGrn = kind !== null && status === receivingStatus.checked && has(grnPermissions[kind]);
  const chosen = rows.filter((row) => selected.has(row.id) && canJoinGrn(row));

  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">{receivingTitles[status]}</h1></div>
      <div className="flex flex-wrap items-center gap-2"><KindSwitch tabs={tabs} kind={kind} onSelect={select} />
        {mayCreateGrn ? <Button type="button" size="sm" disabled={chosen.length === 0} title={chosen.length === 0 ? "Tick the checked materials to put on the note" : undefined} onClick={() => setCreating(true)}><FilePlus2 />Create GRN{chosen.length ? ` (${chosen.length})` : ""}</Button> : null}</div>
    </div>
    <ReceivingTable title={receivingTitles[status]} rows={rows} search={search} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned materials the app could not read." : null}
      paging={{ page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange }}
      selection={mayCreateGrn ? { selected, onChange: (ids) => setPicked({ scope, ids }), isSelectable: canJoinGrn } : undefined} />
    {creating && kind !== null && chosen.length > 0 ? <CreateGrnDialog kind={kind} materials={chosen} onClose={() => setCreating(false)} onDone={() => { setCreating(false); setPicked({ scope, ids: new Set() }); }} /> : null}
  </section>;
}
