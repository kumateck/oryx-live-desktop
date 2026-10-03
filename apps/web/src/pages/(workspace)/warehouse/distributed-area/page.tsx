import { useState } from "react";
import { DistributedTable } from "@/modules/distributed-area/components/distributed-table";
import { ShelveStockDialog } from "@/modules/distributed-area/components/shelve-stock-dialog";
import { useDistributedStock } from "@/modules/distributed-area/hooks/use-distributed-stock";
import { shelvePermissions, viewDistributedPermissions } from "@/modules/distributed-area/lib/distributed-access";
import type { DistributedStock } from "@/modules/distributed-area/schemas/distributed-schema";
import { NoAccess } from "@/shared/auth/no-access";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";

export default function DistributedAreaPage() {
  const kinds = useKindTabs(viewDistributedPermissions);
  const list = useDistributedStock(kinds.kind);
  const [shelving, setShelving] = useState<DistributedStock | null>(null);
  if (kinds.kind === null) return <NoAccess />;
  const kind = kinds.kind;
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Distributed area</h1>
        <p className="text-sm text-muted-foreground">Stock delivered to your store that is not on a shelf yet.</p></div>
      <KindSwitch tabs={kinds.tabs} kind={kind} onSelect={kinds.select} />
    </div>
    {list.noDepartment ? <p role="alert" className="text-sm">Your account has no department, so there is no store to receive stock into.</p>
      : <DistributedTable rows={list.rows} search={list.search} shelvePermission={shelvePermissions[kind]} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onShelve={setShelving} />}
    {shelving ? <ShelveStockDialog key={shelving.id} stock={shelving} kind={kind} onClose={() => setShelving(null)} /> : null}
  </section>;
}
