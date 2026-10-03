import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { BankDialog } from "./bank-dialog";
import { PanelHeading } from "./panel-frame";
import { useDeleteBankDetailMutation, useGetBankDetailsQuery } from "./relationship-api";
import type { BankDetail } from "./types";

const column = dataTableColumns<BankDetail>();
const dash = <span className="text-muted-foreground">–</span>;
/** All but the last four characters hidden, so an account can be told apart without being readable over a shoulder. */
export const maskAccount = (account: string) => account.length > 4 ? `•••• ${account.slice(-4)}` : "••••";

export default function BankingPanel({ supplierId }: { supplierId: string }) {
  const query = useGetBankDetailsQuery(supplierId);
  const [remove] = useDeleteBankDetailMutation();
  const [editing, setEditing] = useState<BankDetail | "new" | null>(null);
  const [removing, setRemoving] = useState<BankDetail | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor("bankName", { header: "Bank", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.bankName}</div>
      {row.original.branchAddress?.trim() ? <div className="break-words text-xs text-muted-foreground">{row.original.branchAddress}</div> : null}</div> }),
    column.accessor("accountName", { header: "Account name", cell: ({ row }) => <span className="break-words">{row.original.accountName}</span> }),
    column.display({ id: "account", header: "Account number", size: 200, cell: ({ row }) => <span className="break-all font-mono text-sm">
      {revealed === row.original.id ? row.original.accountNumber : maskAccount(row.original.accountNumber)}</span> }),
    column.accessor((record) => record.currency.name, { id: "currency", header: "Currency", size: 140 }),
    column.display({ id: "codes", header: "SWIFT / IBAN", cell: ({ row }) => row.original.swiftCode || row.original.iban ? <div className="min-w-0 break-all text-sm">
      {row.original.swiftCode ? <div>{row.original.swiftCode}</div> : null}{row.original.iban ? <div className="text-xs text-muted-foreground">{row.original.iban}</div> : null}</div> : dash }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) => { const shown = revealed === row.original.id; return <TableMenu label={`Actions for ${row.original.bankName} account`} items={[
      { id: "reveal", label: shown ? "Hide account number" : "Show account number", icon: shown ? EyeOff : Eye, onSelect: () => setRevealed(shown ? null : row.original.id) },
      { id: "edit", require: "CanManageSupplierContracts", label: "Edit", icon: Pencil, onSelect: () => setEditing(row.original) },
      { id: "remove", require: "CanManageSupplierContracts", label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => setRemoving(row.original) },
    ]} />; } }),
  ]), [revealed]);

  return <section className="min-w-0 space-y-3">
    <PanelHeading title="Bank accounts" note="Where the supplier is paid. Account numbers stay hidden until shown, one at a time."
      action={<PermissionGuard require="CanManageSupplierContracts"><Button size="sm" variant="outline" onClick={() => setEditing("new")}><Plus />Add account</Button></PermissionGuard>} />
    <ListDataTable label="Bank accounts" columns={columns} rows={query.data ?? []} getRowId={(record) => record.id} loading={query.isLoading}
      error={query.error ? apiErrorMessage(query.error) : null} onRetry={() => { void query.refetch(); }}
      emptyTitle="No bank accounts recorded" emptyDescription="Add the account payments to this supplier should go to." />
    {editing ? <BankDialog key={editing === "new" ? "new" : editing.id} supplierId={supplierId} {...(editing === "new" ? {} : { record: editing })}
      open onOpenChange={(open) => { if (!open) setEditing(null); }} /> : null}
    {removing ? <ConfirmActionDialog require={"CanManageSupplierContracts"} title={`Remove the ${removing.bankName} account?`} description={`The account ending ${removing.accountNumber.slice(-4)} is removed from this supplier's record.`}
      confirmLabel="Remove" busyLabel="Removing…" onClose={() => setRemoving(null)} onConfirm={async () => {
        const result = await remove({ supplierId, id: removing.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Bank account removed"); return null;
      }} /> : null}
  </section>;
}
