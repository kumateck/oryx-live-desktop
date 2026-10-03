import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { PageHeader } from "@/shared/navigation/page-header";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { PrintButton } from "@/shared/print/print-button";
import { usePageSearch } from "@/shared/search/page-search";
import { approvedMaterialsPath } from "../lib/approved-material-access";
import { BinCardPrint } from "./bin-card-print";
import { BinCardTable, ReservedTable, StockByBatchTable } from "./stock-tables";

type Tab = "stock" | "bin-card" | "reserved";
const tabs = [{ id: "stock" as const, label: "Stock by batch" }, { id: "bin-card" as const, label: "Bin card" }, { id: "reserved" as const, label: "Reserved" }];

export interface MaterialHeader { id: string; code: string | null; name: string; kind: 0 | 1; pharmacopoeia: string | null; category: string | null }

/** One approved material: where its stock sits, how it has moved, and what is set aside for production. */
export function ApprovedMaterialDetail({ material }: { material: MaterialHeader }) {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const [active, select] = useTabParam<Tab>(tabs, "stock");
  // The header search filters the bin card, the one list here long enough to need it.
  const search = usePageSearch("bin card entries", false);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={material.name} crumbs={[{ label: "Approved materials", to: `${approvedMaterialsPath}?type=${material.kind}` }, { label: material.name }]} />
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">{materialKindLabels[material.kind]} material</Badge>
      {material.code ? <span className="font-mono">{material.code}</span> : null}
      {material.category ? <span>· {material.category}</span> : null}
      {material.pharmacopoeia ? <span>· {material.pharmacopoeia}</span> : null}
    </div>
    {departmentId ? <Tabs label="Stock records" tabs={tabs} active={active} onSelect={select}>
      {active === "stock" ? <StockByBatchTable materialId={material.id} departmentId={departmentId} /> : null}
      {active === "bin-card" ? <div className="space-y-2"><div className="flex justify-end"><PrintButton label="Print bin card" preview={(close) => <BinCardPrint material={material} departmentId={departmentId} search={search} onClose={close} />} /></div>
        <BinCardTable materialId={material.id} departmentId={departmentId} search={search} /></div> : null}
      {active === "reserved" ? <ReservedTable materialId={material.id} departmentId={departmentId} /> : null}
    </Tabs> : <p role="alert" className="text-sm">Your account has no department, so there is no warehouse stock to show.</p>}
  </article>;
}
