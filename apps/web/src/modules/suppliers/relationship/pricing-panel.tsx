import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo, useState } from "react";
import { Archive, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PanelHeading } from "./panel-frame";
import { PricingDialog } from "./pricing-dialog";
import { useArchivePricingMutation, useGetPricingQuery } from "./relationship-api";
import type { PricingAgreement } from "./types";

const column = dataTableColumns<PricingAgreement>();
const status = ["Pending approval", "Approved", "Rejected"] as const;
const statusVariant = ["outline", "default", "destructive"] as const;
const change = ["New agreement", "Replacement", "Archive request"] as const;
const price = (record: { currency: { symbol?: string | null | undefined }; agreedPrice: number; priceUoM: string }) =>
  `${record.currency.symbol ?? ""}${record.agreedPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })} per ${record.priceUoM}`;

export default function PricingPanel({ supplierId }: { supplierId: string }) {
  const query = useGetPricingQuery(supplierId);
  const [archive] = useArchivePricingMutation();
  const [editing, setEditing] = useState<PricingAgreement | "new" | null>(null);
  const [archiving, setArchiving] = useState<PricingAgreement | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">Bought in {row.original.uoMName}</div>
      {row.original.notes?.trim() ? <div className="break-words text-xs text-muted-foreground">{row.original.notes}</div> : null}</div> }),
    column.accessor("agreedPrice", { header: "Agreed price", size: 200, cell: ({ row }) => <div><div className="font-medium">{price(row.original)}</div>
      {row.original.priorAgreedPrice != null ? <div className="text-xs text-muted-foreground">was {row.original.priorCurrencySymbol ?? ""}{row.original.priorAgreedPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}{row.original.priorPriceUoM ? ` per ${row.original.priorPriceUoM}` : ""}</div> : null}</div> }),
    column.accessor("effectiveFrom", { header: "Effective", size: 220, cell: ({ row }) => `${formatDate(row.original.effectiveFrom) ?? "–"} to ${row.original.effectiveTo ? formatDate(row.original.effectiveTo) ?? "–" : "open ended"}` }),
    column.accessor((record) => status[record.status], { id: "status", header: "Status", size: 190, cell: ({ row }) => <div className="flex flex-wrap gap-1">
      <Badge variant={statusVariant[row.original.status]}>{status[row.original.status]}</Badge>
      {row.original.status !== 1 || row.original.changeKind !== 0 ? <Badge variant="outline">{change[row.original.changeKind]}</Badge> : null}</div> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => {
      // Only an approved agreement that is not already being archived can be changed; every change goes for approval.
      const open = row.original.status === 1 && row.original.changeKind !== 2;
      const closed = open ? {} : { disabled: true, disabledReason: row.original.status === 0 ? "Waiting for approval" : row.original.status === 2 ? "This proposal was rejected" : "An archive request is in progress" };
      return <TableMenu label={`Actions for ${row.original.materialName} pricing`} items={[
        { id: "change", require: "CanManageSupplierContracts", label: "Propose a change", icon: Pencil, onSelect: () => setEditing(row.original), ...closed },
        { id: "archive", require: "CanManageSupplierContracts", label: "Request archive", icon: Archive, onSelect: () => setArchiving(row.original), ...closed },
      ]} />;
    } }),
  ]), []);

  return <section className="min-w-0 space-y-3">
    <PanelHeading title="Pricing agreements" note="A new price, a change, or an archive request takes effect only once it is approved."
      action={<PermissionGuard require="CanManageSupplierContracts"><Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Propose agreement</Button></PermissionGuard>} />
    <ListDataTable label="Pricing agreements" columns={columns} rows={query.data ?? []} getRowId={(record) => record.id} loading={query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }}
      emptyTitle="No pricing agreements" emptyDescription="Propose the agreed price for a material this supplier provides." />
    {editing ? <PricingDialog key={editing === "new" ? "new" : editing.id} supplierId={supplierId} {...(editing === "new" ? {} : { record: editing })}
      open onOpenChange={(open) => { if (!open) setEditing(null); }} /> : null}
    {archiving ? <ConfirmActionDialog require={"CanManageSupplierContracts"} title={`Request archive of the ${archiving.materialName} price?`} description="The agreement stays in force until the request is approved."
      confirmLabel="Submit request" busyLabel="Submitting…" destructive={false} onClose={() => setArchiving(null)} onConfirm={async () => {
        const result = await archive({ supplierId, id: archiving.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Archive request submitted for approval"); return null;
      }} /> : null}
  </section>;
}
