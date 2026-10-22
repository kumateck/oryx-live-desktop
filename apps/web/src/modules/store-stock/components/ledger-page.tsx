import { useParams, useSearchParams, Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { itemSchema, type InventoryItem } from "@/shared/inventory/contracts";
import { storeValue, stockLink, type Store } from "@/shared/inventory/stores";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { stockApi } from "../api/stock-api";
import { ledgerRows, stockAudit as audit, ReceiptStatus, type LedgerRow } from "../schemas/stock";
const schema = z.object({ filter: z.object({ value: z.string(), label: z.string() }).nullable() });
const options = ["Damaged", "Missing", "Returned", "Issued", "Purchased", "Adjustment"].map((label, n) => ({ value: String(n), label }));
const fields: WizardField<z.infer<typeof schema>>[] = [
  { type: I.SELECT, mode: "single", source: "sync", name: "filter", label: "Transaction type", placeholder: "All transactions", options },
];
const c = dataTableColumns<LedgerRow>();
const number = (n: number) => formatQuantityNumber(n, "calculated");
const columns = c.columns([
  c.accessor((r) => formatDateTime(r.date), { id: "date", header: "Transaction date" }),
  c.accessor((r) => formatDateTime(r.createdAt), { id: "recorded", header: "Recorded" }),
  c.accessor("transactionType", { header: "Type" }),
  c.accessor((r) => number(r.credit), { id: "credit", header: "Credit" }),
  c.accessor((r) => number(r.debit), { id: "debit", header: "Debit" }),
  c.accessor((r) => number(r.totalBalance), { id: "balance", header: "Balance" }),
  c.accessor((r) => (r.shadowHold == null ? "Not recorded" : number(r.shadowHold)), { id: "hold", header: "Shadow hold" }),
]);
function Entries({ item }: { item: InventoryItem }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { filter: null } });
  const filter = useWatch({ control: form.control, name: "filter" });
  const query = inventoryApi.useGetApiV1ItemsByItemCodeTransactionsQuery({
    ...audit,
    itemCode: item.code,
    ...(filter ? { transactionType: filter.value } : {}),
  });
  const parsed = ledgerRows.safeParse(query.currentData);
  const valid = parsed.success && parsed.data.every((r) => r.itemCode === item.code) && new Set(parsed.data.map((r) => r.id)).size === parsed.data.length;
  const rows = valid ? parsed.data : [];
  const mismatch = !filter && query.currentData && valid && (rows[0]?.totalBalance ?? 0) !== item.availableQuantity;
  return (
    <section className="page-fill">
      <PageHeader title={`${item.name} transactions`} crumbs={[{ label: "Available stock", to: stockLink(item.store, "available") }, { label: item.code }]} />
      <KeyFacts>
        <KeyFact label="Item code" value={item.code} />
        <KeyFact label="Available balance" value={number(item.availableQuantity)} note={item.unitOfMeasure.name} />
      </KeyFacts>
      <div className="max-w-sm">
        <FormWizard form={form} fields={fields} />
      </div>
      {mismatch ? (
        <p role="alert" className="text-destructive">
          The posted ledger balance and current available stock disagree. Reconcile the records before posting another stock change.
        </p>
      ) : null}
      <ClientDataTable
        label="Item transactions"
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        initialPageSize={30}
        loading={query.isLoading}
        refreshing={query.isFetching && !query.isLoading}
        error={query.error ? apiErrorMessage(query.error) : query.currentData && !valid ? "The item ledger identity could not be verified." : null}
        onRetry={() => void query.refetch()}
        emptyTitle="No transactions"
        emptyDescription="Change the transaction type or check another item."
      />
    </section>
  );
}
function Bound({ id, code, store }: { id: string; code: string; store: Store }) {
  const query = inventoryApi.useGetApiV1ItemsByIdQuery({ ...audit, id });
  const parsed = itemSchema.safeParse(query.currentData);
  if (query.isLoading) return <DetailPageSkeleton label="Loading item ledger identity" />;
  if (query.error || !parsed.success || parsed.data.id !== id || parsed.data.store !== store || parsed.data.code !== code)
    return (
      <section role="alert" className="space-y-3">
        <p>{query.error ? apiErrorMessage(query.error) : "The item code, identity and store could not be verified."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return <Entries key={`${id}:${code}`} item={parsed.data} />;
}
function Resolve({ code, store }: { code: string; store: Store }) {
  const query = stockApi.useStockRegisterQuery({ store, status: ReceiptStatus.Approved, search: code, page: 1, pageSize: 100 });
  const matches = query.currentData?.data.filter((r) => r.item.code === code) ?? [];
  const ids = [...new Set(matches.map((r) => r.itemId))];
  const id = ids.length === 1 ? ids[0] : null;
  if (query.isLoading) return <DetailPageSkeleton label="Resolving stock item" />;
  return id && query.currentData && query.currentData.totalRecordCount === query.currentData.data.length ? (
    <Bound id={id} code={code} store={store} />
  ) : (
    <section role="alert" className="space-y-3">
      <p>{query.error ? apiErrorMessage(query.error) : "Select a specific item from the available stock register to open its ledger."}</p>
      <Link className="underline" to={stockLink(store, "available")}>
        Back to available stock
      </Link>
    </section>
  );
}
export function LedgerPage() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType") ?? "1");
  const id = params.get("itemId");
  if (store === undefined || !code || code.length > 256) return <p role="alert">A valid store and item code are required.</p>;
  if (id)
    return z.uuid().safeParse(id).success ? (
      <Bound key={`${id}:${store}:${code}`} id={id} code={code} store={store} />
    ) : (
      <p role="alert">A valid item identity is required.</p>
    );
  return <Resolve key={`${code}:${store}`} code={code} store={store} />;
}
