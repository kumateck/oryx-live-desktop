import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useVendorListQuery } from "../api/avl-api";
import { detailSchema, monthLabel } from "../lib/avl";
import { avlAudit } from "../lib/keys";

/** The list an approver is deciding: its header numbers and every line. */
export function VendorListApprovalEvidence({ id }: { id: string }) {
  const query = useVendorListQuery({ ...avlAudit, id });
  const parsed = useMemo(() => query.data ? detailSchema.safeParse(query.data) : null, [query.data]);
  if (query.isLoading) return <Skeleton className="h-40 w-full" />;
  if (query.error || !parsed?.success) return <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The list could not be read."}</p>;
  const list = parsed.data;
  return <section aria-label="Approved vendor list" className="space-y-3">
    <dl className="grid gap-3 text-sm sm:grid-cols-4">
      <div><dt className="text-xs text-muted-foreground">Annexure No.</dt><dd>{list.annexureNumber ?? "–"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Revision No.</dt><dd>{list.revisionNumber}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Supersedes</dt><dd>{list.supersedesRevision ?? "–"}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Checked by</dt><dd>{list.checkedBy?.name ?? "–"}</dd></div>
    </dl>
    <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm">
      <thead className="bg-muted/50 text-left"><tr><th className="p-2">Material</th><th className="p-2">Manufacturer</th><th className="p-2">Supplier</th><th className="p-2 text-right">Qty/Pack (kg)</th><th className="p-2">Approved</th><th className="p-2">Valid until</th></tr></thead>
      <tbody>{list.lines.map((line) => <tr key={line.id} className="border-t align-top">
        <td className="p-2">{line.materialCode ? `${line.materialCode} · ` : ""}{line.materialName}</td>
        <td className="p-2">{line.manufacturerName}{line.manufacturerAddress ? <span className="block text-xs text-muted-foreground">{line.manufacturerAddress}</span> : null}</td>
        <td className="p-2">{line.supplierName}</td><td className="p-2 text-right">{line.quantityPerPack}</td><td className="p-2">{monthLabel(line.approvalDate)}</td>
        <td className="p-2">{monthLabel(line.validityDate)}{line.lapsed ? <Badge className="ml-1" variant="destructive">Lapsed</Badge> : null}</td></tr>)}</tbody>
    </table></div>
  </section>;
}
