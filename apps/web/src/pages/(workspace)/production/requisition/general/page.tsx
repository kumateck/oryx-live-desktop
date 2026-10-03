import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { RequisitionsTable } from "@/modules/requisitions/components/requisitions-table";
import { useRequisitionsList } from "@/modules/requisitions/hooks/use-requisitions-list";
import { listAudit, requisitionPath } from "@/modules/requisitions/lib/requisition-access";
import type { RequisitionType } from "@/modules/requisitions/lib/requisition-status";

const filters = [{ id: "all", label: "All", type: null }, { id: "purchase", label: "Purchase", type: 1 }, { id: "stock", label: "Stock", type: 0 }] as const satisfies readonly { id: string; label: string; type: RequisitionType | null }[];

export default function RequisitionsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filter = filters.find((item) => item.id === params.get("show")) ?? filters[0];
  const list = useRequisitionsList({ audit: listAudit, type: filter.type, searchLabel: "requisitions" });
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">PRODUCTION</p><h1 className="text-xl font-semibold">Material requisitions</h1></div>
      <div role="group" aria-label="Requisition type" className="flex gap-1">{filters.map((item) => <Button key={item.id} type="button" size="sm" variant={item.id === filter.id ? "default" : "outline"}
        aria-pressed={item.id === filter.id} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("show", item.id); return next; }, { replace: true })}>{item.label}</Button>)}</div>
    </div>
    <RequisitionsTable label="Material requisitions" rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      showType={filter.type === null} onOpen={(row) => void navigate(requisitionPath(row.id))} emptyTitle="No requisitions" emptyDescription="Requisitions raised for materials appear here." />
  </section>;
}
