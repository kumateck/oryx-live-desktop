import { lazy, Suspense, useState } from "react";
import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useAccess } from "@/shared/auth/use-access";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { servicesApi } from "@/shared/api/generated/services";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { serviceSchema, servicesAudit as audit, type StoreService } from "@/shared/services/contracts";
import { ServiceActions } from "./service-actions";
const Editor = lazy(() => import("./service-editor").then((m) => ({ default: m.ServiceEditor })));
const schema = z.object({ search: z.string(), active: z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable() });
const fields: WizardField<z.infer<typeof schema>>[] = [
  { type: I.TEXT, name: "search", label: "Search services" },
  {
    type: I.SELECT,
    name: "active",
    label: "Status",
    mode: "single",
    source: "sync",
    options: [
      { value: "0", label: "Active" },
      { value: "1", label: "Inactive" },
    ],
  },
];
const c = dataTableColumns<StoreService>();
const columns = c.columns([
  c.display({
    id: "name",
    header: "Service",
    cell: ({ row }) => (
      <Link className="text-primary hover:underline" to={`/extrals/services/${encodeURIComponent(row.original.id)}`}>
        {row.original.name}
      </Link>
    ),
  }),
  c.accessor("code", { header: "Code" }),
  c.accessor((r) => formatDate(r.startDate), { id: "start", header: "Starts" }),
  c.accessor((r) => formatDate(r.endDate), { id: "end", header: "Ends" }),
  c.accessor((r) => (r.isActive ? "Active" : "Inactive"), { id: "active", header: "Status" }),
  c.accessor((r) => r.attachments.length, { id: "files", header: "Attachments" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ServiceActions row={row.original} /> }),
]);
export function ServicesPage() {
  const { has } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { search: "", active: { value: "0", label: "Active" } } });
  const values = useWatch({ control: form.control });
  const search = useDebouncedValue(values.search ?? "");
  const isActive = values.active?.value !== "1";
  const table = useServerTable({ resetKey: `${search}:${isActive}` });
  const query = servicesApi.useGetApiV1ServicesQuery({ ...audit, searchQuery: search, isActive, page: table.page, pageSize: table.pageSize });
  const parsed = z.array(serviceSchema).safeParse(query.currentData?.data);
  const rows = parsed.success ? parsed.data : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title="Services"
        crumbs={[{ label: "General stores and services" }, { label: "Services" }]}
        actions={has("CanCreateService") ? <Button onClick={() => setCreating(true)}>Create service</Button> : null}
      />
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <FormWizard form={form} fields={fields} />
      </div>
      <ServerDataTable
        label="Services"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : query.currentData && !parsed.success ? "The service register could not be verified." : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No matching services"
        emptyDescription="Change the status or search, or create a service."
      />
      {creating ? (
        <Suspense fallback={<p role="status">Loading service editor…</p>}>
          <Editor onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
