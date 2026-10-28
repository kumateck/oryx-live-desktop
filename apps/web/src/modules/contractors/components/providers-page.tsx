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
import { providerRowSchema, providerAudit as audit, type ProviderRow } from "../schemas/provider";
import { ProviderActions } from "./provider-actions";
const Editor = lazy(() => import("./provider-editor").then((m) => ({ default: m.ProviderEditor })));
const schema = z.object({ search: z.string() });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.TEXT, name: "search", label: "Search service providers" }];
const c = dataTableColumns<ProviderRow>();
const columns = c.columns([
  c.display({
    id: "name",
    header: "Provider",
    cell: ({ row }) => (
      <Link className="text-primary hover:underline" to={`/extrals/services-providers/${encodeURIComponent(row.original.id)}`}>
        {row.original.name}
      </Link>
    ),
  }),
  c.accessor("phone", { header: "Telephone" }),
  c.accessor("email", { header: "Email" }),
  c.accessor((r) => r.country?.name ?? "Not recorded", { id: "country", header: "Country" }),
  c.accessor((r) => r.currency?.name ?? "Not recorded", { id: "currency", header: "Currency" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ProviderActions id={row.original.id} name={row.original.name} /> }),
]);
export function ProvidersPage() {
  const { has } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { search: "" } });
  const search = useDebouncedValue(useWatch({ control: form.control, name: "search" }));
  const table = useServerTable({ resetKey: search });
  const query = servicesApi.useGetApiV1ServiceProvidersQuery({ ...audit, searchQuery: search, page: table.page, pageSize: table.pageSize });
  const parsed = z.array(providerRowSchema).safeParse(query.currentData?.data);
  const rows = parsed.success ? parsed.data : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title="Service providers"
        crumbs={[{ label: "Services" }, { label: "Service providers" }]}
        actions={has("CanCreateContractors") ? <Button onClick={() => setCreating(true)}>Create provider</Button> : null}
      />
      <div className="max-w-sm">
        <FormWizard form={form} fields={fields} />
      </div>
      <ServerDataTable
        label="Service providers"
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
        error={query.error ? apiErrorMessage(query.error) : query.currentData && !parsed.success ? "The contractor register could not be verified." : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No matching service providers"
        emptyDescription="Change the search or create a provider."
      />
      {creating ? (
        <Suspense fallback={<p role="status">Loading contractor editor…</p>}>
          <Editor onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
