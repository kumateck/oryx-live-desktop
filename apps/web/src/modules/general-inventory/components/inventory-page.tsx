import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { inventoryLink, itemRule, storeValue, stores, type Store } from "@/shared/inventory/stores";
import { itemPage, classifications, inventoryAudit as audit, type InventoryItem } from "@/shared/inventory/contracts";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toLargestUnit } from "@/shared/units/quantity";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { ItemActions } from "./item-actions";
import { StoreLinks } from "./store-links";
const searchSchema = z.object({ search: z.string() });
const fields: WizardField<z.infer<typeof searchSchema>>[] = [{ type: I.TEXT, name: "search", label: "Search inventory", placeholder: "Item name or code" }];
const c = dataTableColumns<InventoryItem>();
const columns = c.columns([
  c.accessor("code", { header: "Code" }),
  c.accessor("name", { header: "Item" }),
  c.accessor((r) => r.itemCategory?.name ?? "Not assigned", { id: "category", header: "Category" }),
  c.accessor((r) => classifications[r.classification], { id: "classification", header: "Classification" }),
  c.accessor((r) => toLargestUnit(r.availableQuantity, r.unitOfMeasure.symbol)?.text, { id: "stock", header: "Available stock" }),
  c.accessor((r) => r.unitOfMeasure.name, { id: "unit", header: "Unit" }),
  c.accessor((r) => (r.isActive ? "Active" : "Inactive"), { id: "status", header: "Status" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ItemActions row={row.original} /> }),
]);
function Register({ store }: { store: Store }) {
  const { allows } = useAccess();
  const form = useForm<z.infer<typeof searchSchema>>({ resolver: zodResolver(searchSchema), defaultValues: { search: "" } });
  const searchQuery = useDebouncedValue(useWatch({ control: form.control, name: "search" }), 300).trim();
  const table = useServerTable({ resetKey: `${store}:${searchQuery}` });
  const query = inventoryApi.useGetApiV1ItemsQuery({ ...audit, store, searchQuery, page: table.page, pageSize: table.pageSize });
  const parsed = itemPage.safeParse(query.currentData);
  const valid = parsed.success && parsed.data.data.every((r) => r.store === store);
  const rows = valid ? parsed.data.data : [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title={`${stores[store]} inventory`}
        crumbs={[{ label: "General stores" }, { label: "Inventory" }]}
        actions={
          allows(itemRule(store, "create")) ? (
            <Button asChild>
              <Link to={inventoryLink(store, "/create")}>Create item</Link>
            </Button>
          ) : null
        }
      />
      <StoreLinks store={store} />
      <div className="max-w-sm">
        <FormWizard form={form} fields={fields} />
      </div>
      <ServerDataTable
        label="Inventory items"
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
        error={query.error ? apiErrorMessage(query.error) : query.currentData && !valid ? "The store inventory response could not be verified." : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No inventory items"
        emptyDescription="Change the search or create an item in this store."
      />
    </section>
  );
}
export function InventoryPage() {
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType") ?? "1");
  return store === undefined ? <p role="alert">Choose a valid inventory store.</p> : <Register key={store} store={store} />;
}
