import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { Tabs, useTabParam } from "@/shared/detail/tabs";
import { PageHeader } from "@/shared/navigation/page-header";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { PrintButton } from "@/shared/print/print-button";
import { usePageSearch } from "@/shared/search/page-search";
import { approvedMaterialsPath, stockPrintPermissions, stockTracePermissions } from "../lib/approved-material-access";
import { BinCardPrint } from "./bin-card-print";
import { BinCardTable, ReservedTable, StockByBatchTable } from "./stock-tables";
import { StockTracePanel } from "./stock-trace-panel";
import { StockReportPreview } from "./stock-report-preview";

type Tab = "stock" | "bin-card" | "reserved" | "floor" | "consumed" | "reconciliation";
const tabs = [{ id: "stock" as const, label: "Stock by batch" }, { id: "bin-card" as const, label: "Bin card" }, { id: "reserved" as const, label: "Reserved" }];
const traceTabs = [{ id: "floor" as const, label: "Production floor" }, { id: "consumed" as const, label: "Consumed" }, { id: "reconciliation" as const, label: "Reconciliation" }];

export interface MaterialHeader { id: string; code: string | null; name: string; kind: 0 | 1; pharmacopoeia: string | null; category: string | null }

/** One approved material: where its stock sits, how it has moved, and what is set aside for production. */
export function ApprovedMaterialDetail({ material }: { material: MaterialHeader }) {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const { has } = useAccess();
  const mayTrace = has(stockTracePermissions[material.kind]);
  const mayPrint = has(stockPrintPermissions[material.kind]);
  const availableTabs = mayTrace ? [...tabs, ...traceTabs] : tabs;
  const [active, select] = useTabParam<Tab>(availableTabs, "stock");
  // The header search filters the bin card, the one list here long enough to need it.
  const search = usePageSearch("stock records", false);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={material.name} crumbs={[{ label: "Approved materials", to: `${approvedMaterialsPath}?type=${material.kind}` }, { label: material.name }]}
      actions={departmentId && mayPrint ? <PrintButton label="Print material details" preview={(close) => <StockReportPreview material={material} departmentId={departmentId} view="details" onClose={close} />} /> : undefined} />
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">{materialKindLabels[material.kind]} material</Badge>
      {material.code ? <span className="font-mono">{material.code}</span> : null}
      {material.category ? <span>· {material.category}</span> : null}
      {material.pharmacopoeia ? <span>· {material.pharmacopoeia}</span> : null}
    </div>
    {departmentId ? <Tabs label="Stock records" tabs={availableTabs} active={active} onSelect={select}>
      {(active === "stock" || active === "reserved") && mayPrint ? <div className="mb-3 flex justify-end"><PrintButton label={active === "stock" ? "Print stock by batch" : "Print reserved"}
        preview={(close) => <StockReportPreview material={material} departmentId={departmentId} view={active} search={search} onClose={close} />} /></div> : null}
      {active === "stock" ? <StockByBatchTable materialId={material.id} departmentId={departmentId} /> : null}
      {active === "bin-card" ? <div className="space-y-2">{mayPrint ? <div className="flex justify-end"><PrintButton label="Print bin card" preview={(close) => <BinCardPrint material={material} departmentId={departmentId} search={search} onClose={close} />} /></div> : null}
        <BinCardTable materialId={material.id} departmentId={departmentId} search={search} /></div> : null}
      {active === "reserved" ? <ReservedTable materialId={material.id} departmentId={departmentId} kind={material.kind} /> : null}
      {active === "floor" || active === "consumed" || active === "reconciliation" ? <StockTracePanel materialId={material.id} departmentId={departmentId} kind={material.kind} view={active} search={search} /> : null}
    </Tabs> : <p role="alert" className="text-sm">Your account has no department, so there is no warehouse stock to show.</p>}
  </article>;
}
