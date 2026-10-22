import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { ServerDataTable, dataTableColumns, useServerTable, pageMeta } from "@/shared/datatable";
import { StoreLinks } from "@/shared/inventory/store-links";
import { storeValue, stores, type Store } from "@/shared/inventory/stores";
import { toLargestUnit, formatQuantityNumber } from "@/shared/units/quantity";
import { formatDateTime } from "@/shared/format/dates";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { stockApi } from "../api/stock-api";
import { ReceiptStatus, type StockReceipt } from "../schemas/stock";
import { StockActions } from "./stock-actions";
import { ReceiptActions } from "./receipt-actions";
const schema = z.object({ search: z.string() });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: I.TEXT, name: "search", label: "Search stock", placeholder: "Item, code or memo" }];
const c = dataTableColumns<StockReceipt>();
const quantity = (r: StockReceipt, n: number) => toLargestUnit(n, r.item.unitOfMeasure?.symbol)?.text ?? formatQuantityNumber(n, "entered");
const common = c.columns([
  c.accessor((r) => r.item.name, { id: "item", header: "Item" }),
  c.accessor((r) => r.item.code, { id: "code", header: "Code" }),
  c.accessor((r) => r.memo?.code ?? r.memoId, { id: "memo", header: "Memo" }),
  c.accessor((r) => formatDateTime(r.createdAt), { id: "created", header: "Received" }),
]);
const available = c.columns([
  ...common,
  c.accessor((r) => quantity(r, r.item.availableQuantity), { id: "available", header: "Available quantity" }),
  c.accessor((r) => quantity(r, r.item.minimumLevel), { id: "minimum", header: "Minimum" }),
  c.accessor((r) => quantity(r, r.item.maximumLevel), { id: "maximum", header: "Maximum" }),
  c.accessor((r) => quantity(r, r.item.reorderLevel), { id: "reorder", header: "Reorder" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <StockActions row={row.original} /> }),
]);
const receiving = c.columns([
  ...common,
  c.accessor((r) => quantity(r, r.quantity), { id: "received", header: "Receipt quantity" }),
  c.accessor((r) => [r.createdBy?.firstName, r.createdBy?.lastName].filter(Boolean).join(" ") || "Unverified creator", { id: "creator", header: "Created by" }),
  c.display({ id: "actions", header: "", size: 40, cell: ({ row }) => <ReceiptActions row={row.original} /> }),
]);
function Register({ store, scope }: { store: Store; scope: "available" | "receiving" }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { search: "" } });
  const search = useDebouncedValue(useWatch({ control: form.control, name: "search" }), 300).trim();
  const table = useServerTable({ resetKey: `${store}:${scope}:${search}` });
  const query = stockApi.useStockRegisterQuery({
    store,
    status: scope === "available" ? ReceiptStatus.Approved : ReceiptStatus.Pending,
    search,
    page: table.page,
    pageSize: table.pageSize,
  });
  const rows = query.currentData?.data ?? [];
  const meta = pageMeta(query.currentData, table, rows.length);
  return (
    <section className="page-fill">
      <PageHeader
        title={`${stores[store]} ${scope === "available" ? "available stock" : "receiving area"}`}
        crumbs={[{ label: "General stores" }, { label: scope === "available" ? "Available stock" : "Receiving" }]}
      />
      <StoreLinks store={store} scope={scope} />
      {scope === "available" ? (
        <p className="text-muted-foreground">
          Rows identify approved receipts. An item with several receipts repeats its current available balance; those balances must not be added together.
        </p>
      ) : null}
      <div className="max-w-sm">
        <FormWizard form={form} fields={fields} />
      </div>
      <ServerDataTable
        label={scope === "available" ? "Approved stock receipts" : "Pending stock receipts"}
        rows={rows}
        columns={scope === "available" ? available : receiving}
        getRowId={(r) => r.id}
        page={table.page}
        pageSize={table.pageSize}
        totalRows={meta.totalRows}
        onPageChange={table.onPageChange}
        onPageSizeChange={table.onPageSizeChange}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : null}
        onRetry={() => void query.refetch()}
        emptyTitle={scope === "available" ? "No approved stock receipts" : "No pending receipts"}
        emptyDescription="Change the store or search to find other entries."
      />
    </section>
  );
}
export function StockPage({ scope = "available" }: { scope?: "available" | "receiving" }) {
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType") ?? "1");
  return store === undefined ? <p role="alert">Choose a valid store.</p> : <Register key={`${store}:${scope}`} store={store} scope={scope} />;
}
