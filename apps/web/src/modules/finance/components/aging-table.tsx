import { useMemo, useState } from "react";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMoney } from "@/shared/procurement/price";
import type { AgingReport, AgingParty } from "../api/finance-api";
import { AgingPartyDialog } from "./aging-party-dialog";
const column = dataTableColumns<AgingParty>();
const bucketFields = [{ key: "current", label: "Current" }, { key: "days0To30", label: "0–30" }, { key: "days31To60", label: "31–60" }, { key: "days61To90", label: "61–90" }, { key: "daysOver90", label: "90+" }, { key: "dueDateUnknown", label: "Due unknown" }] as const;
export function AgingTable({ title, report }: { title: string; report: AgingReport }) {
  const [party, setParty] = useState<AgingParty | null>(null);
  const currency = report.baseCurrencyName ?? "Base currency not recorded";
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.partyName ?? "", { id: "party", header: "Party" }),
    ...bucketFields.map((bucket) => column.accessor((row) => row.bucketsBase?.[bucket.key] ?? "", { id: bucket.key, header: bucket.label, size: 105, cell: ({ row }) => formatMoney(row.original.bucketsBase?.[bucket.key]) })),
    column.accessor((row) => row.totalOutstandingBase ?? "", { id: "total", header: "Total", cell: ({ row }) => formatMoney(row.original.totalOutstandingBase) }),
  ]), []);
  return <section className="space-y-3"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{title}</h2><p>{formatMoney(report.totalOutstandingBase, currency)}</p></div>
    <p className="text-sm text-muted-foreground">All columns use the reporting currency. Open a party to see its original document amounts, conversion rates and due dates.</p>
    <ListDataTable label={title} columns={columns} rows={report.parties ?? []} getRowId={(row) => row.partyId ?? row.partyName ?? ""} onRowOpen={setParty} emptyTitle="No outstanding balances" emptyDescription="No outstanding documents were returned for this date." maxHeight="32rem" />
    {party ? <AgingPartyDialog party={party} currency={currency} onClose={() => setParty(null)} /> : null}
  </section>;
}
