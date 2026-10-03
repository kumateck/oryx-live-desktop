import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePageSearch } from "@/shared/search/page-search";
import { useDeleteApiV1CustomersByIdMutation, useGetApiV1CustomersQuery, usePostApiV1CustomersMutation, usePutApiV1CustomersByIdMutation } from "../api/customer-api";
import { audit, customerPath, customerPermissions } from "../lib/customers";
import { customerFormSchema, customerRowsSchema, type CustomerFormValues, type CustomerRow } from "../schemas/customer-schema";
import { FormDialog } from "./form-dialog";

const fields: WizardField<CustomerFormValues>[] = [
  { type: InputTypes.TEXT, name: "name", label: "Customer name", required: true },
  { type: InputTypes.EMAIL, name: "email", label: "Email", required: true },
  { type: InputTypes.TEXT, name: "phone", label: "Phone number", required: true },
  { type: InputTypes.TEXT, name: "address", label: "Address", required: true },
];

/** Adds a customer, or changes one's name and how to reach them. */
export function CustomerDialog({ customer, onClose }: { customer: CustomerRow | null; onClose: () => void }) {
  const [create, creating] = usePostApiV1CustomersMutation();
  const [update, updating] = usePutApiV1CustomersByIdMutation();
  const [message, setMessage] = useState("");
  const form = useForm<CustomerFormValues>({ resolver: zodResolver(customerFormSchema), defaultValues: { name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "", address: customer?.address ?? "" } });
  const permission = usePermissionAction(customer ? customerPermissions.edit : customerPermissions.create);
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const body = { name: values.name, address: values.address, phone: values.phone, email: values.email };
    const result = customer ? await update({ ...audit, id: customer.id, domainEntitiesCustomersCreateCustomerRequest: body }) : await create({ ...audit, domainEntitiesCustomersCreateCustomerRequest: body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(customer ? `${values.name} updated` : `${values.name} added`);
    onClose();
  });
  return <FormDialog allowed={permission.allowed} title={customer ? `Edit ${customer.name}` : "New customer"} description={customer ? "Commercial terms, contacts and pricing are kept in the customer's workspace." : "Commercial terms, contacts and pricing are added in the customer's workspace afterwards."}
    form={form} fields={fields} submitLabel={customer ? "Save changes" : "Add customer"} busy={creating.isLoading || updating.isLoading} message={message} onSubmit={(event) => void submit(event)} onClose={onClose} />;
}

const column = dataTableColumns<CustomerRow>();
type Open = { kind: "create" } | { kind: "edit" | "delete"; customer: CustomerRow } | null;

/** Everyone the company sells to. A row opens the customer's workspace. */
export function CustomersPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("customers", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1CustomersQuery({ ...audit, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: !has(customerPermissions.view) });
  const [remove] = useDeleteApiV1CustomersByIdMutation();
  const parsed = useMemo(() => query.data ? customerRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Customer", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
    column.accessor((row) => row.address ?? "", { id: "address", header: "Address", cell: ({ row }) => <span className="break-words">{row.original.address ?? "–"}</span> }),
    column.accessor((row) => row.email ?? "", { id: "email", header: "Email", size: 260, cell: ({ row }) => <span className="break-all">{row.original.email ?? "–"}</span> }),
    column.accessor((row) => row.phone ?? "", { id: "phone", header: "Phone", size: 170, cell: ({ row }) => row.original.phone ?? "–" }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "open", label: "Open workspace", icon: Eye, to: customerPath(row.original.id) },
      { id: "edit", label: "Edit", icon: Pencil, require: customerPermissions.edit, onSelect: () => setOpen({ kind: "edit", customer: row.original }) },
      { id: "delete", label: "Delete", icon: Trash2, destructive: true, require: customerPermissions.remove, onSelect: () => setOpen({ kind: "delete", customer: row.original }) },
    ]} /> }),
  ]), []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">Customers</h1></div>
      {has(customerPermissions.create) ? <Button type="button" size="sm" onClick={() => setOpen({ kind: "create" })}><Plus />New customer</Button> : null}
    </div>
    <ServerDataTable label="Customers" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(customerPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned customers the app could not read." : null}
      emptyTitle={search.trim() ? "No customers match this search" : "No customers yet"} emptyDescription={search.trim() ? "Search by name, email or phone." : "Add the first customer to start taking orders."} />
    {open?.kind === "create" ? <CustomerDialog customer={null} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "edit" ? <CustomerDialog key={open.customer.id} customer={open.customer} onClose={() => setOpen(null)} /> : null}
    {open?.kind === "delete" ? <ConfirmActionDialog require={customerPermissions.remove} title={`Delete ${open.customer.name}?`} description="The customer is removed from the list. Orders and invoices already raised for them are kept." confirmLabel="Delete customer" busyLabel="Deleting…" onClose={() => setOpen(null)}
      onConfirm={async () => { const result = await remove({ ...audit, id: open.customer.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success(`${open.customer.name} deleted`); return null; }} /> : null}
  </section>;
}
