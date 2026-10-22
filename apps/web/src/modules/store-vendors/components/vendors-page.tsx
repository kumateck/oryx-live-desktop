import { lazy, Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useAccess } from "@/shared/auth/use-access";
import { PageHeader } from "@/shared/navigation/page-header";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { ClientDataTable, ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { audit, vendorSchema, type Vendor } from "../schemas/vendor";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { vendorSearchApi } from "../api/vendor-search";
import { VendorActions } from "./vendor-actions";
const Editor = lazy(() => import("./vendor-editor").then((m) => ({ default: m.VendorEditor })));
const schema = z.object({ search: z.string() });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.TEXT, name: "search", label: "Search vendors", placeholder: "Vendor name or email" }];
const c = dataTableColumns<Vendor>();
const columns = c.columns([
  c.accessor("name", { header: "Vendor" }),
  c.accessor("contactPerson", { header: "Contact" }),
  c.accessor("phone", { header: "Telephone" }),
  c.accessor("email", { header: "Email" }),
  c.accessor((r) => r.country?.name ?? r.countryId, { id: "country", header: "Country" }),
  c.accessor((r) => r.currency?.name ?? r.currencyId, { id: "currency", header: "Currency" }),
  c.accessor((r) => r.items.length, { id: "items", header: "Items" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <VendorActions row={row.original} /> }),
]);
export function VendorsPage() {
  const { has } = useAccess();
  const [creating, setCreating] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { search: "" } });
  const search = useDebouncedValue(useWatch({ control: form.control, name: "search" }), 300).trim();
  const table = useServerTable({ resetKey: search });
  const query = inventoryApi.useGetApiV1VendorsQuery({ ...audit, page: table.page, pageSize: table.pageSize }, { skip: !!search });
  const results = vendorSearchApi.useSearchStoreVendorsQuery(search, { skip: !search });
  const parsed = z.array(vendorSchema).safeParse(query.currentData?.data);
  const rows = parsed.success ? parsed.data : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title="Store vendors"
        crumbs={[{ label: "General stores" }, { label: "Vendors" }]}
        actions={has("CanCreateVendor") ? <Button onClick={() => setCreating(true)}>Create vendor</Button> : null}
      />
      <div className="max-w-sm">
        <FormWizard form={form} fields={fields} />
      </div>
      {search ? (
        <ClientDataTable
          label="Matching store vendors"
          rows={results.currentData ?? []}
          columns={columns}
          getRowId={(r) => r.id}
          initialPageSize={30}
          loading={results.isLoading}
          refreshing={results.isFetching && !results.isLoading}
          error={results.error ? apiErrorMessage(results.error) : null}
          onRetry={() => void results.refetch()}
          emptyTitle="No matching vendors"
          emptyDescription="Change the vendor name, email, contact or telephone search."
        />
      ) : (
        <ServerDataTable
          label="Store vendors"
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
          error={
            query.error
              ? apiErrorMessage(query.error)
              : query.currentData && !parsed.success
                ? "The vendor response could not be verified. Refresh before changing a vendor."
                : null
          }
          onRetry={() => void query.refetch()}
          emptyTitle="No matching vendors"
          emptyDescription="Change the search or create a store vendor."
        />
      )}
      {creating ? (
        <Suspense fallback={<p role="status">Loading vendor editor…</p>}>
          <Editor onClose={() => setCreating(false)} />
        </Suspense>
      ) : null}
    </section>
  );
}
