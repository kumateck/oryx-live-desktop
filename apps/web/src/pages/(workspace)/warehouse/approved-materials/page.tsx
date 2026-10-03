import { useNavigate } from "react-router";
import { ApprovedMaterialsTable } from "@/modules/approved-materials/components/approved-materials-table";
import { useApprovedMaterialsList } from "@/modules/approved-materials/hooks/use-approved-materials-list";
import { approvedMaterialPath } from "@/modules/approved-materials/lib/approved-material-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";

export default function ApprovedMaterialsPage() {
  const list = useApprovedMaterialsList();
  const navigate = useNavigate();
  const kind = list.kinds.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Approved materials</h1></div>
      <KindSwitch tabs={list.kinds.tabs} kind={kind} onSelect={list.kinds.select} />
    </div>
    <ApprovedMaterialsTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      onOpen={(row) => { if (kind !== null) void navigate(approvedMaterialPath(row.id, kind)); }} />
  </section>;
}
