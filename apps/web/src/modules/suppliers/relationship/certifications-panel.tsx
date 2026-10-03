import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { daysUntil, dueState, dueText } from "@/shared/format/due-dates";
import { CertificationDialog } from "./certification-dialog";
import { certificationTypes } from "./certification-types";
import { PanelHeading } from "./panel-frame";
import { useDeleteCertificationMutation, useGetCertificationsQuery } from "./relationship-api";
import type { Certification } from "./types";

const column = dataTableColumns<Certification>();
const manage = "CanManageSupplierCertifications";

function Validity({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate);
  const state = dueState(days);
  return <div className="space-y-0.5"><div>{formatDate(expiryDate) ?? "–"}</div>
    {state === "overdue" ? <Badge variant="destructive">Expired</Badge> : state === "soon" && days !== null ? <Badge variant="outline" className="border-amber-500/60 text-amber-700 dark:text-amber-400">Expires {dueText(days)}</Badge>
      : <Badge variant="secondary">Valid</Badge>}</div>;
}

export default function CertificationsPanel({ supplierId }: { supplierId: string }) {
  const canManage = useAccess().has(manage);
  const query = useGetCertificationsQuery(supplierId);
  const [remove] = useDeleteCertificationMutation();
  const [editing, setEditing] = useState<Certification | "new" | null>(null);
  const [removing, setRemoving] = useState<Certification | null>(null);
  // Those needing attention first: expired, then the soonest to expire.
  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)), [query.data]);
  const columns = useMemo(() => column.columns([
    column.accessor((record) => certificationTypes[record.certificationType], { id: "type", header: "Certificate", cell: ({ row }) => <div className="min-w-0">
      <div className="font-medium">{certificationTypes[row.original.certificationType]}</div><div className="break-words text-xs text-muted-foreground">{row.original.certificateNumber}</div></div> }),
    column.accessor("issuingBody", { header: "Issued by", cell: ({ row }) => <span className="break-words">{row.original.issuingBody}</span> }),
    column.accessor((record) => formatDate(record.issueDate) ?? "–", { id: "issued", header: "Issued", size: 130 }),
    column.accessor("expiryDate", { header: "Expires", size: 190, cell: ({ row }) => <Validity expiryDate={row.original.expiryDate} /> }),
    column.accessor((record) => record.attachments.length, { id: "files", header: "Files", size: 80, cell: ({ row }) => row.original.attachments.length || "–" }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for certificate ${row.original.certificateNumber}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: manage, onSelect: () => setEditing(row.original) },
      { id: "remove", label: "Remove", icon: Trash2, destructive: true, require: manage, onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]), []);

  return <section className="min-w-0 space-y-3">
    <PanelHeading title="Certifications" note="Quality certificates held by the supplier. An expired certificate is listed first."
      action={canManage ? <Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Add certification</Button> : undefined} />
    <ListDataTable label="Certifications" columns={columns} rows={rows} getRowId={(record) => record.id} loading={query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }}
      emptyTitle="No certifications recorded" emptyDescription={canManage ? "Add the supplier's GMP, ISO, or other certificates to track when they expire." : undefined} />
    {editing ? <CertificationDialog key={editing === "new" ? "new" : editing.id} supplierId={supplierId} {...(editing === "new" ? {} : { record: editing })}
      open onOpenChange={(open) => { if (!open) setEditing(null); }} /> : null}
    {removing ? <ConfirmActionDialog require={manage} title={`Remove certificate ${removing.certificateNumber}?`} description="The certificate is removed from this supplier's record. This cannot be undone."
      confirmLabel="Remove" busyLabel="Removing…" onClose={() => setRemoving(null)} onConfirm={async () => {
        const result = await remove({ supplierId, id: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Certification removed"); return null;
      }} /> : null}
  </section>;
}
