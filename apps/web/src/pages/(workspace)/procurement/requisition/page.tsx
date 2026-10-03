import { useNavigate } from "react-router";
import { RequisitionsTable } from "@/modules/requisitions/components/requisitions-table";
import { useRequisitionsList } from "@/modules/requisitions/hooks/use-requisitions-list";
import { audit, sourcingPath } from "@/modules/sourcing/lib/sourcing-access";

export default function PurchaseRequisitionsPage() {
  // Approved purchase requisitions with at least one material still waiting for suppliers.
  const list = useRequisitionsList({ audit, type: 1, status: 1, searchLabel: "purchase requisitions" });
  const navigate = useNavigate();
  return <section className="page-fill">
    <div><p className="eyebrow">PROCUREMENT</p><h1 className="text-xl font-semibold">Purchase requisitions</h1>
      <p className="text-sm text-muted-foreground">Approved requisitions waiting for suppliers to be chosen.</p></div>
    <RequisitionsTable label="Purchase requisitions" rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      showType={false} onOpen={(row) => void navigate(sourcingPath(row.id))} emptyTitle="Nothing to source" emptyDescription="Purchase requisitions appear here once they are approved." />
  </section>;
}
