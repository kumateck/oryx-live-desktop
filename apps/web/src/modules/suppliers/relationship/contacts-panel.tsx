import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { ContactDialog } from "./contact-dialog";
import { PanelHeading } from "./panel-frame";
import { useDeleteContactMutation, useGetContactsQuery } from "./relationship-api";
import type { Contact } from "./types";

const column = dataTableColumns<Contact>();
const link = "break-words text-primary underline-offset-2 hover:underline";
const dash = <span className="text-muted-foreground">–</span>;

export default function ContactsPanel({ supplierId }: { supplierId: string }) {
  const query = useGetContactsQuery(supplierId);
  const [remove] = useDeleteContactMutation();
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [removing, setRemoving] = useState<Contact | null>(null);
  // The primary contact first, then by name.
  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name)), [query.data]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Name", cell: ({ row }) => <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="break-words font-medium">{row.original.name}</span>
      {row.original.isPrimary ? <Badge>Primary</Badge> : null}</div> }),
    column.accessor((record) => record.role ?? "", { id: "role", header: "Role", cell: ({ row }) => row.original.role?.trim() ? <span className="break-words">{row.original.role}</span> : dash }),
    column.accessor((record) => record.email ?? "", { id: "email", header: "Email", cell: ({ row }) => { const email = row.original.email?.trim();
      return email ? <a className={link} href={`mailto:${email}`}>{email}</a> : dash; } }),
    column.accessor((record) => record.phone ?? "", { id: "phone", header: "Phone", size: 180, cell: ({ row }) => { const phone = row.original.phone?.trim();
      return phone ? <a className={link} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a> : dash; } }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "edit", require: "CanManageSupplierContracts", label: "Edit", icon: Pencil, onSelect: () => setEditing(row.original) },
      { id: "remove", require: "CanManageSupplierContracts", label: "Remove", icon: Trash2, destructive: true, onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]), []);

  return <section className="min-w-0 space-y-3">
    <PanelHeading title="Contacts" note="People at the supplier. The primary contact is the first person to reach."
      action={<PermissionGuard require="CanManageSupplierContracts"><Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Add contact</Button></PermissionGuard>} />
    <ListDataTable label="Contacts" columns={columns} rows={rows} getRowId={(record) => record.id} loading={query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }}
      emptyTitle="No contacts recorded" emptyDescription="Add the people to reach for orders, quality, and accounts." />
    {editing ? <ContactDialog key={editing === "new" ? "new" : editing.id} supplierId={supplierId} {...(editing === "new" ? {} : { record: editing })}
      open onOpenChange={(open) => { if (!open) setEditing(null); }} /> : null}
    {removing ? <ConfirmActionDialog require={"CanManageSupplierContracts"} title={`Remove ${removing.name}?`} description="The contact is removed from this supplier's record."
      confirmLabel="Remove" busyLabel="Removing…" onClose={() => setRemoving(null)} onConfirm={async () => {
        const result = await remove({ supplierId, id: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Contact removed"); return null;
      }} /> : null}
  </section>;
}
