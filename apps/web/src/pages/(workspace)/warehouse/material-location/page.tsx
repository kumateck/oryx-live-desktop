import { useNavigate } from "react-router";
import { MaterialStockTable } from "@/modules/material-location/components/material-stock-table";
import { useMaterialStockList } from "@/modules/material-location/hooks/use-material-stock-list";
import { materialLocationPath } from "@/modules/material-location/lib/material-location-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";

export default function MaterialLocationPage() {
  const list = useMaterialStockList();
  const navigate = useNavigate();
  const kind = list.kinds.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Material location</h1></div>
      <KindSwitch tabs={list.kinds.tabs} kind={kind} onSelect={list.kinds.select} />
    </div>
    <MaterialStockTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry}
      onOpen={(row) => { if (kind !== null) void navigate(materialLocationPath(row.id, kind)); }} />
  </section>;
}
